import { type GuildMember } from 'discord.js';
import { Event }       from '../structures/Event';
import UserManager     from '../managers/UserManager';
import logger          from '../utils/Logger';

export default new Event({
  name: 'guildMemberAdd',
  async execute(member: GuildMember) {
    if (member.user.bot) return;
    logger.debug(`[guildMemberAdd] ${member.user.tag} joined ${member.guild.name}`);
    try {
      await UserManager.getUser(member.user.id, member.guild.id);
      await UserManager.getEconomy(member.user.id);
      await UserManager.updateUsername(member.user.id, member.user.username);
      await UserManager.grantAchievement(member.user.id, 'first_balance');
    } catch (err) {
      logger.error('[guildMemberAdd] Failed to init user:', (err as Error).message);
    }
  },
});
