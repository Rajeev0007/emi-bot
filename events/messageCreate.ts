/**
 * @file messageCreate.ts
 * @description Handles incoming messages:
 *   - Awards passive XP (unchanged from before)
 *   - Routes prefix commands (e.g. !balance, !daily) to the same execute()
 *     functions used by slash commands via MessageCommandAdapter.
 */

import { type Message, type Client, Collection, MessageFlags } from 'discord.js';
import { Event }   from '../structures/Event';
import { Command } from '../structures/Command';
import { MessageCommandAdapter } from '../structures/MessageAdapter';
import UserManager from '../managers/UserManager';
import cooldowns   from '../managers/CooldownManager';
import config      from '../config/config';
import logger      from '../utils/Logger';
import fmt         from '../utils/Formatter';
import * as CB     from '../builders/ComponentBuilder';

// ── IS_COMPONENTS_V2 flag (1 << 15) — needed for guard error replies ─────────
const IS_V2     = Number((MessageFlags as Record<string, unknown>).IsComponentsV2 ?? 32768);
const EPHEMERAL = Number((MessageFlags as Record<string, unknown>).Ephemeral      ?? 64);
const V2_FLAGS  = IS_V2; // guard errors in prefix context are never ephemeral

// ── Passive XP cooldown (per user, 60 s) ────────────────────────────────────
const _xpCooldown    = new Map<string, number>();
const XP_COOLDOWN_MS = 60_000;

// ── Helper: send a short-lived error reply to a message ──────────────────────
async function replyError(message: Message, title: string, desc: string): Promise<void> {
  try {
    await message.reply({
      ...(CB.errorResponse(title, desc) as object),
      flags: V2_FLAGS,
    } as never);
  } catch {
    // Fallback to plain text if V2 fails for any reason
    await message.reply(`❌ **${title}:** ${desc}`).catch(() => {});
  }
}

export default new Event({
  name: 'messageCreate',

  async execute(message: Message, client: Client & {
    commands?: Collection<string, Command>;
  }) {
    if (message.author.bot) return;
    if (!message.guild)     return;   // DMs are ignored

    const prefix = config.prefix;

    // ── Mention shortcut ─────────────────────────────────────────────────────
    if (message.mentions.has(client.user!)) {
      await message.reply(
        `👋 Hi! Use \`${prefix}help\` or \`/help\` to see all available commands.`
      ).catch(() => {});
      // Don't return — still award XP if eligible
    }

    // ── Passive XP ───────────────────────────────────────────────────────────
    const userId = message.author.id;
    const lastXp = _xpCooldown.get(userId) ?? 0;
    if (Date.now() - lastXp >= XP_COOLDOWN_MS) {
      _xpCooldown.set(userId, Date.now());
      const xpGain = fmt.randomInt(2, 8);
      try {
        const { leveledUp, newLevel } = await UserManager.addXp(userId, xpGain);
        if (leveledUp) {
          await (message.channel as { send: (m: string) => Promise<unknown> })
            .send(`${message.author} leveled up to **Level ${newLevel}**! 🎉`)
            .catch(() => {});
        }
      } catch (err) {
        logger.debug('[messageCreate] XP error:', (err as Error).message);
      }
    }

    // ── Prefix command check ─────────────────────────────────────────────────
    if (!message.content.startsWith(prefix)) return;

    const raw  = message.content.slice(prefix.length).trim();
    if (!raw)  return;

    const parts       = raw.split(/\s+/);
    const commandName = parts[0].toLowerCase();
    const args        = parts.slice(1);

    if (!client.commands) return;

    // Look up by name first, then by alias
    let command = client.commands.get(commandName);
    if (!command) {
      command = [...client.commands.values()].find(
        (c) => c.aliases.includes(commandName)
      );
    }
    if (!command) return;   // Unknown command — stay silent (no noise)

    // ── Guards ───────────────────────────────────────────────────────────────

    if (command.guildOnly && !message.guild) {
      return void replyError(message, 'Server Only', 'This command can only be used inside a server.');
    }

    if (command.ownerOnly && !config.owners.includes(userId)) {
      return void replyError(message, 'Owner Only', 'This command is restricted to bot owners.');
    }

    if (command.maintenance) {
      return void replyError(message, 'Maintenance', 'This command is temporarily disabled for maintenance.');
    }

    if (command.permissions.length) {
      const member  = message.member;
      const missing = command.permissions.filter(
        (p) => !member?.permissions.has(p as never)
      );
      if (missing.length) {
        return void replyError(message, 'Missing Permissions', `You need: ${missing.join(', ')}`);
      }
    }

    // ── Cooldown ─────────────────────────────────────────────────────────────
    const cdKey = command.cooldown
      ? command.name
      : ['economy', 'gambling', 'social'].includes(command.category)
        ? command.name
        : null;

    if (cdKey) {
      const duration = command.cooldown
        ?? (config.cooldowns as Record<string, number>)[command.name]
        ?? 3000;

      const { onCooldown, remaining } = cooldowns.check(userId, command.name);
      if (onCooldown) {
        try {
          await message.reply({
            ...(CB.cooldownResponse(command.name, remaining) as object),
            flags: V2_FLAGS,
          } as never);
        } catch {
          const secs = Math.ceil(remaining / 1000);
          await message.reply(`⏱️ You can use \`${prefix}${command.name}\` again in **${secs}s**.`).catch(() => {});
        }
        return;
      }
      cooldowns.set(userId, command.name, duration);
    }

    // ── Execute ───────────────────────────────────────────────────────────────
    const adapter = new MessageCommandAdapter(message, command.data, args);

    try {
      logger.command(command.name, message.author.tag, message.guild?.name ?? 'DM');
      await command.execute(adapter as never, client);
    } catch (err) {
      logger.error(`[Prefix] ${command.name} threw:`, (err as Error).message);
      logger.debug((err as Error).stack ?? '');

      const errMsg = (err as Error).message?.slice(0, 200) ?? 'Unknown error';
      try {
        await adapter.sendError({
          ...(CB.errorResponse('Unexpected Error', errMsg) as object),
          flags: V2_FLAGS,
        });
      } catch {
        await message.reply(`❌ Something went wrong: ${errMsg}`).catch(() => {});
      }
    }
  },
});
