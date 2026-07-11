/**
 * @file interactionCreate.ts
 * @description Central router for all incoming Discord interactions.
 */

import { type Interaction, type Client, Collection, MessageFlags, type ChatInputCommandInteraction } from 'discord.js';
import { Event }    from '../structures/Event';
import { Command }  from '../structures/Command';
import config       from '../config/config';
import logger       from '../utils/Logger';
import cooldowns    from '../managers/CooldownManager';
import * as CB      from '../builders/ComponentBuilder';

export default new Event({
  name: 'interactionCreate',
  async execute(interaction: Interaction, client: Client & { commands?: Collection<string, Command>; interactionHandler?: { handle: (i: Interaction) => Promise<void> } }) {

    // Autocomplete interactions
    if (interaction.isAutocomplete()) {
      try {
        const cmd = client.commands?.get(interaction.commandName);
        if (cmd?.autocomplete) await cmd.autocomplete(interaction as never, client);
      } catch (err) {
        logger.error(`[interactionCreate] Autocomplete error for /${interaction.commandName}:`, (err as Error).message);
      }
      return;
    }

    // Non-slash-command interactions (buttons, modals, select menus)
    if (!interaction.isChatInputCommand()) {
      try {
        await client.interactionHandler?.handle(interaction);
      } catch (err) {
        logger.error(`[interactionCreate] Interaction handler error:`, (err as Error).message);
        // Try to respond so Discord doesn't show "This interaction failed"
        try {
          const i = interaction as any;
          if (!i.replied && !i.deferred) {
            await i.reply({ content: '❌ An error occurred processing this interaction.', ephemeral: true });
          }
        } catch { /* ignore */ }
      }
      return;
    }

    // Slash command handling
    const cmdInteraction = interaction as ChatInputCommandInteraction;
    const cmdName = cmdInteraction.commandName;
    const command = client.commands?.get(cmdName);

    if (!command) {
      logger.warn(`[interactionCreate] Unknown command: /${cmdName}`);
      await cmdInteraction.reply({ content: '❌ Unknown command.', ephemeral: true }).catch(() => {});
      return;
    }

    const guild  = cmdInteraction.guild;
    const userId = cmdInteraction.user.id;

    // Guard: guild-only
    if (command.guildOnly && !guild) {
      await cmdInteraction.reply(
        CB.errorResponse('Server Only', 'This command can only be used inside a server.') as any,
      ).catch(() => {});
      return;
    }

    // Guard: owner-only
    if (command.ownerOnly && !config.owners.includes(userId)) {
      await cmdInteraction.reply(
        CB.errorResponse('Owner Only', 'This command is restricted to bot owners.') as any,
      ).catch(() => {});
      return;
    }

    // Guard: maintenance
    if (command.maintenance) {
      await cmdInteraction.reply(
        CB.errorResponse('Maintenance', 'This command is temporarily disabled.') as any,
      ).catch(() => {});
      return;
    }

    // Guard: permissions
    if (command.permissions.length && guild) {
      const member = cmdInteraction.member as { permissions?: { has: (p: string) => boolean } } | null;
      const missing = command.permissions.filter((p) => !member?.permissions?.has(p));
      if (missing.length) {
        await cmdInteraction.reply(
          CB.errorResponse('Missing Permissions', `You need: ${missing.join(', ')}`) as any,
        ).catch(() => {});
        return;
      }
    }

    // Cooldown check
    const cdKey = command.cooldown
      ? command.name
      : ['economy', 'gambling', 'social'].includes(command.category)
        ? (command.category === 'social' ? 'social' : command.name)
        : null;

    if (cdKey) {
      const duration = command.cooldown ?? config.cooldowns[cdKey] ?? config.cooldowns[command.name] ?? 3000;
      const { onCooldown, remaining } = cooldowns.check(userId, command.name);
      if (onCooldown) {
        await cmdInteraction.reply(
          CB.cooldownResponse(command.name, remaining) as any,
        ).catch(() => {});
        return;
      }
      cooldowns.set(userId, command.name, duration);
    }

    // Execute command
    try {
      logger.command(command.name, cmdInteraction.user.tag, guild?.name ?? 'DM');
      await command.execute(cmdInteraction, client);
    } catch (err) {
      logger.error(`[interactionCreate] /${command.name} threw:`, (err as Error).message);
      logger.debug((err as Error).stack ?? '');

      const errContent = `Something went wrong.\n\`\`\`${(err as Error).message.slice(0, 200)}\`\`\``;
      try {
        if (cmdInteraction.replied || cmdInteraction.deferred) {
          await cmdInteraction.followUp(
            CB.errorResponse('Unexpected Error', errContent) as any,
          );
        } else {
          await cmdInteraction.reply(
            CB.errorResponse('Unexpected Error', errContent) as any,
          );
        }
      } catch (replyErr) {
        logger.error(`[interactionCreate] Failed to send error reply:`, (replyErr as Error).message);
      }
    }
  },
});
