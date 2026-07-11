import {
  SlashCommandBuilder, MessageFlags, ContainerBuilder,
  TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { Command } from '../../structures/Command';
import config      from '../../config/config';

const CATEGORIES: Record<string, { emoji: string; desc: string; commands: string[] }> = {
  economy:     { emoji: '💰', desc: 'Earn, spend, and manage coins', commands: ['balance','daily','weekly','work','crime','rob','beg','search','deposit','withdraw','transfer','prestige','richest'] },
  gambling:    { emoji: '🎰', desc: 'Risk it for the biscuit',       commands: ['coinflip','slots','blackjack','dice','roulette','crash','mines'] },
  social:      { emoji: '🤗', desc: 'Interact with other users',     commands: ['hug','kiss','pat','slap','cuddle','bonk','wave','dance','cry','poke'] },
  music:       { emoji: '🎵', desc: 'Music playback',                commands: ['play','queue','skip','stop','leave','pause','resume','loop','nowplaying','seek','shuffle','volume','247','autoplay','setvoice'] },
  anime:       { emoji: '🎌', desc: 'Anime search and images',       commands: ['anime','waifu'] },
  shop:        { emoji: '🏪', desc: 'Buy items and gear',            commands: ['shop'] },
  inventory:   { emoji: '🎒', desc: 'Manage your items',             commands: ['inventory'] },
  pets:        { emoji: '🐾', desc: 'Virtual pets',                  commands: ['pet'] },
  leaderboard: { emoji: '🏆', desc: 'Global rankings',               commands: ['leaderboard'] },
  utility:     { emoji: '⚙️', desc: 'Bot info and tools',            commands: ['help','ping','stats'] },
};

function buildOverview(): ContainerBuilder {
  const lines = Object.entries(CATEGORIES).map(([key, cat]) => `> ${cat.emoji} **${key.charAt(0).toUpperCase() + key.slice(1)}** — ${cat.desc}`);
  return new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent([`# ${config.bot.name} Help`, `*Premium Discord Economy Bot*`].join('\n')))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join('\n')))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Select a category below for detailed commands'));
}

function buildCategory(key: string, cat: { emoji: string; desc: string; commands: string[] }): ContainerBuilder {
  return new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent([`# ${cat.emoji} ${key.charAt(0).toUpperCase() + key.slice(1)} Commands`, cat.desc].join('\n')))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(cat.commands.map((c) => `> \`/${c}\``).join('\n')))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${cat.commands.length} command(s)`));
}

function catButtons(active: string): ActionRowBuilder<ButtonBuilder>[] {
  const entries = Object.entries(CATEGORIES);
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let i = 0; i < entries.length; i += 5) {
    const row = new ActionRowBuilder<ButtonBuilder>();
    entries.slice(i, i + 5).forEach(([key, cat]) => {
      row.addComponents(new ButtonBuilder().setCustomId(`help_cat:${key}`).setLabel(key.charAt(0).toUpperCase() + key.slice(1)).setEmoji(cat.emoji).setStyle(key === active ? ButtonStyle.Primary : ButtonStyle.Secondary));
    });
    rows.push(row);
  }
  return rows;
}

export default new Command({
  data: new SlashCommandBuilder()
    .setName('help').setDescription('View all available commands.')
    .addStringOption((o) => o.setName('category').setDescription('Jump to a category')
      .addChoices(...Object.keys(CATEGORIES).map((k) => ({ name: k, value: k })))),
  category: 'utility', cooldown: 3000,
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 as any });
    let active = (interaction.options.get('category')?.value as string) ?? 'home';
    const container = active === 'home' ? buildOverview() : buildCategory(active, CATEGORIES[active]);
    const msg = await interaction.editReply({ components: [container, ...catButtons(active)] });
    const collector = (msg as { createMessageComponentCollector: (o: { filter: (i: { user: { id: string }; customId: string }) => boolean; time: number }) => { on: (e: string, cb: (i: { customId: string; update: (o: unknown) => Promise<void> }) => void) => void } }).createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id && (i.customId.startsWith('help_cat:') || i.customId === 'help_home'), time: 120_000,
    });
    collector.on('collect', async (i) => {
      if (i.customId === 'help_home') { active = 'home'; await i.update({ components: [buildOverview(), ...catButtons('home')] }); }
      else { active = i.customId.split(':')[1]; await i.update({ components: [buildCategory(active, CATEGORIES[active]), ...catButtons(active)] }); }
    });
  },
});
