import { type Message, type Client } from 'discord.js';
import { Event }    from '../structures/Event';
import UserManager  from '../managers/UserManager';
import logger       from '../utils/Logger';
import fmt          from '../utils/Formatter';

const _xpCooldown  = new Map<string, number>();
const XP_COOLDOWN_MS = 60_000;

export default new Event({
  name: 'messageCreate',
  async execute(message: Message, client: Client) {
    if (message.author.bot) return;
    if (!message.guild) return;

    if (message.mentions.has(client.user!)) {
      await message.reply('👋 Hi! Use `/help` to see all available commands.').catch(() => {});
      return;
    }

    const userId = message.author.id;
    const last   = _xpCooldown.get(userId) ?? 0;
    if (Date.now() - last < XP_COOLDOWN_MS) return;
    _xpCooldown.set(userId, Date.now());

    const xpGain = fmt.randomInt(2, 8);
    try {
      const { leveledUp, newLevel } = await UserManager.addXp(userId, xpGain);
      if (leveledUp) {
        await (message.channel as any).send(`${message.author} leveled up to **Level ${newLevel}**! 🎉`).catch(() => {});
      }
    } catch (err) {
      logger.debug('[messageCreate] XP error:', (err as Error).message);
    }
  },
});
