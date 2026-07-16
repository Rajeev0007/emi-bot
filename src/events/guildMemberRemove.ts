import { type GuildMember } from 'discord.js';
import { Event }  from '../structures/Event';
import logger     from '../utils/Logger';

export default new Event({
  name: 'guildMemberRemove',
  async execute(member: GuildMember) {
    if (member.user.bot) return;
    logger.debug(`[guildMemberRemove] ${member.user.tag} left ${member.guild.name}`);
  },
});
