import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../structures/Command';
import music       from '../../managers/MusicManager';
import { musicCheck, musicError, musicSuccess } from '../../utils/MusicUtil';

export default new Command({
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current track (or multiple tracks).')
    .addIntegerOption((o) => o.setName('amount').setDescription('Number of tracks to skip').setMinValue(1).setMaxValue(100)),
  category: 'music',
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const { error, session, player } = musicCheck(interaction, music, { needsPlaying: true });
    if (error) return interaction.editReply(musicError(error) as never);
    const amount = Math.min(interaction.options.get('amount')?.value as number ?? 1, session!.queueList.length + 1);
    const title  = (session!.current?.info as { title?: string })?.title ?? 'Unknown';
    if (amount > 1) session!.queueList.splice(0, amount - 1);
    await (player as { skip: () => Promise<void> }).skip();
    const msg = amount > 1 ? `Skipped **${amount}** tracks.` : `Skipped **${title}**.`;
    return interaction.editReply(musicSuccess(msg) as never);
  },
});
