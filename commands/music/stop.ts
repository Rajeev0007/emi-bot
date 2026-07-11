import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../structures/Command';
import music       from '../../managers/MusicManager';
import { musicCheck, musicError, musicSuccess } from '../../utils/MusicUtil';

export default new Command({
  data: new SlashCommandBuilder().setName('stop').setDescription('Stop playback, clear the queue, and leave.'),
  category: 'music',
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const { error } = musicCheck(interaction, music, { needsQueue: true });
    if (error) return interaction.editReply(musicError(error) as never);
    await music.destroyPlayer(interaction.guild!.id);
    return interaction.editReply(musicSuccess('⏹️ Stopped playback and cleared the queue.') as never);
  },
});
