/**
 * @file help.ts
 * @description Professional help menu with a category select menu inside a V2 container.
 */

import {
  SlashCommandBuilder, MessageFlags,
  ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize,
  ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
  type ChatInputCommandInteraction, type Client, Collection,
  type StringSelectMenuInteraction,
} from 'discord.js';
import { Command }    from '../../structures/Command';
import config         from '../../config/config';

// ── Category definitions ──────────────────────────────────────────────────────
const CATEGORIES: Record<string, { emoji: string; label: string; desc: string; commands: string[] }> = {
  economy:     { emoji: '💰', label: 'Economy',     desc: 'Earn, spend, and manage your coins',      commands: ['balance','daily','weekly','work','crime','rob','beg','search','deposit','withdraw','transfer','prestige','richest'] },
  gambling:    { emoji: '🎰', label: 'Gambling',    desc: 'Risk your coins for big rewards',          commands: ['slots','blackjack','coinflip','dice','roulette','crash','mines'] },
  social:      { emoji: '🤗', label: 'Social',      desc: 'Interact and emote with other users',      commands: ['hug','kiss','pat','slap','cuddle','bonk','wave','dance','cry','poke'] },
  music:       { emoji: '🎵', label: 'Music',       desc: 'Play music in voice channels',             commands: ['play','queue','skip','stop','leave','pause','resume','loop','nowplaying','seek','shuffle','volume','247','autoplay','setvoice'] },
  anime:       { emoji: '🎌', label: 'Anime',       desc: 'Anime images and character search',        commands: ['anime','waifu'] },
  shop:        { emoji: '🏪', label: 'Shop',        desc: 'Browse and buy items',                     commands: ['shop'] },
  inventory:   { emoji: '🎒', label: 'Inventory',   desc: 'View and manage your items',               commands: ['inventory'] },
  pets:        { emoji: '🐾', label: 'Pets',        desc: 'Hatch, feed, and level up virtual pets',   commands: ['pet'] },
  leaderboard: { emoji: '🏆', label: 'Leaderboard', desc: 'Global rankings and top players',          commands: ['leaderboard'] },
  utility:     { emoji: '⚙️', label: 'Utility',     desc: 'Bot information and server tools',         commands: ['help','ping','stats','botbrand'] },
  profile:     { emoji: '🧑‍💼', label: 'Profile',     desc: 'Your stats, XP, levels, and achievements', commands: ['profile'] },
};

// ── Builders ──────────────────────────────────────────────────────────────────

function buildOverview(botName: string): ContainerBuilder {
  const lines = Object.values(CATEGORIES).map(
    (c) => `> ${c.emoji} **${c.label}** — ${c.desc}`
  );
  const total = Object.values(CATEGORIES).reduce((n, c) => n + c.commands.length, 0);

  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# ${botName}\n*Your all-in-one Discord economy and fun bot*`
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(lines.join('\n'))
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `-# ${total} commands total · Use \`/command\` or \`${config.prefix}command\` · Select a category below`
      )
    );
}

function buildCategory(
  key: string,
  commandDescriptions: Map<string, string>,
): ContainerBuilder {
  const cat = CATEGORIES[key];
  const lines = cat.commands.map((name) => {
    const desc = commandDescriptions.get(name) ?? '';
    return desc
      ? `\`/${name}\` — ${desc}`
      : `\`/${name}\``;
  });

  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# ${cat.emoji} ${cat.label}\n${cat.desc}`
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(lines.join('\n'))
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `-# ${cat.commands.length} command${cat.commands.length !== 1 ? 's' : ''} · Works with slash \`/\` and prefix \`${config.prefix}\``
      )
    );
}

function buildSelectMenu(active: string, disabled = false): ActionRowBuilder<StringSelectMenuBuilder> {
  const menu = new StringSelectMenuBuilder()
    .setCustomId('help_select')
    .setPlaceholder('📋 Browse categories…')
    .setDisabled(disabled)
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setValue('overview')
        .setLabel('Overview')
        .setDescription('All categories at a glance')
        .setEmoji('🏠')
        .setDefault(active === 'overview'),
      ...Object.entries(CATEGORIES).map(([key, cat]) =>
        new StringSelectMenuOptionBuilder()
          .setValue(key)
          .setLabel(cat.label)
          .setDescription(cat.desc.slice(0, 100))
          .setEmoji(cat.emoji.replace(/\uFE0F/g, '')) // strip variation selector for emoji objects
          .setDefault(key === active)
      ),
    );

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}

// ── Command ───────────────────────────────────────────────────────────────────
export default new Command({
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Browse all bot commands by category.')
    .addStringOption((o) =>
      o.setName('category')
        .setDescription('Jump straight to a category')
        .addChoices(
          { name: '🏠 Overview', value: 'overview' },
          ...Object.entries(CATEGORIES).map(([k, c]) => ({ name: `${c.emoji} ${c.label}`, value: k })),
        )
    ),
  category: 'utility',
  aliases: ['h', 'commands', 'cmds'],
  cooldown: 3000,

  async execute(interaction: ChatInputCommandInteraction, client?: Client) {
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 as never });

    // Build a name→description map from loaded commands
    const cmdCollection = (client as unknown as { commands?: Collection<string, Command> })?.commands;
    const descMap = new Map<string, string>();
    if (cmdCollection) {
      for (const [name, cmd] of cmdCollection) {
        descMap.set(name, (cmd.data as { description?: string }).description ?? '');
      }
    }

    const initCat = interaction.options.getString('category') ?? 'overview';
    const container = initCat === 'overview'
      ? buildOverview(config.bot.name)
      : buildCategory(initCat, descMap);

    container.addActionRowComponents(buildSelectMenu(initCat));
    const msg = await interaction.editReply({ components: [container] });

    // ── Collector: handle select menu interactions ──────────────────────────
    const collector = (msg as {
      createMessageComponentCollector: (opts: {
        filter: (i: { user: { id: string }; customId: string }) => boolean;
        time: number;
      }) => {
        on: (
          event: string,
          cb: (i: StringSelectMenuInteraction) => void
        ) => void;
      };
    }).createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id && i.customId === 'help_select',
      time: 120_000,
    });

    collector.on('collect', async (i: StringSelectMenuInteraction) => {
      const value     = (i.values as string[])[0];
      const newContainer = value === 'overview'
        ? buildOverview(config.bot.name)
        : buildCategory(value, descMap);

      newContainer.addActionRowComponents(buildSelectMenu(value));
      await i.update({
        flags: MessageFlags.IsComponentsV2 as never,
        components: [newContainer],
      });
    });

    collector.on('end', async () => {
      // Disable the menu when the 2-minute window closes
      const disabledContainer = initCat === 'overview'
        ? buildOverview(config.bot.name)
        : buildCategory(initCat, descMap);
      disabledContainer.addActionRowComponents(buildSelectMenu(initCat, true));
      interaction.editReply({ components: [disabledContainer] }).catch(() => {});
    });
  },
});
