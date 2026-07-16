/**
 * @file UserManager.ts
 * @description Manages user profiles, XP, levels, achievements, and stats.
 */

import { getStore }  from '../database/JsonStore';
import config        from '../config/config';
import logger        from '../utils/Logger';

const usersDB        = getStore('users');
const economyDB      = getStore('economy');
const achievementsDB = getStore('achievements');
const profilesDB     = getStore('profiles');
const actionsDB      = getStore('actions');

export interface UserData {
  userId: string; guildId: string; username: string; createdAt: number;
  level: number; xp: number; totalXp: number; prestige: number;
  reputation: number; title: string; badges: string[]; achievements: string[];
  stats: {
    commandsUsed: number; gamesPlayed: number; gamesWon: number;
    socialActions: number; crimeCount: number; crimeSuccess: number;
    robCount: number; robSuccess: number; fishCount: number; mineCount: number;
    huntCount: number; farmCount: number; chopCount: number; craftCount: number;
  };
  lastSeen: number;
}

export interface EconomyData {
  userId: string; wallet: number; bank: number; netWorth: number;
  totalEarned: number; totalSpent: number; dailyStreak?: number;
  lastDaily: number; lastWeekly: number; lastMonthly: number; lastYearly: number;
  lastWork: number; lastCrime: number; lastRob: number; lastBeg: number;
  lastSearch: number; lastHunt: number; lastFish: number; lastMine: number;
  lastFarm: number; lastChop: number;
  transactions: Array<{ type: string; amount: number; description: string; timestamp: number }>;
}

function defaultUser(userId: string, guildId: string): UserData {
  return {
    userId, guildId, username: '', createdAt: Date.now(),
    level: 1, xp: 0, totalXp: 0, prestige: 0, reputation: 0,
    title: 'Newcomer', badges: [], achievements: [],
    stats: {
      commandsUsed: 0, gamesPlayed: 0, gamesWon: 0, socialActions: 0,
      crimeCount: 0, crimeSuccess: 0, robCount: 0, robSuccess: 0,
      fishCount: 0, mineCount: 0, huntCount: 0, farmCount: 0,
      chopCount: 0, craftCount: 0,
    },
    lastSeen: Date.now(),
  };
}

function defaultEconomy(userId: string): EconomyData {
  return {
    userId, wallet: config.economy.startingBalance, bank: config.economy.startingBank,
    netWorth: config.economy.startingBalance, totalEarned: 0, totalSpent: 0,
    lastDaily: 0, lastWeekly: 0, lastMonthly: 0, lastYearly: 0,
    lastWork: 0, lastCrime: 0, lastRob: 0, lastBeg: 0, lastSearch: 0,
    lastHunt: 0, lastFish: 0, lastMine: 0, lastFarm: 0, lastChop: 0,
    transactions: [],
  };
}

const UserManager = {
  async getUser(userId: string, guildId = 'global'): Promise<UserData> {
    return usersDB.ensure(`${userId}`, defaultUser(userId, guildId)) as Promise<UserData>;
  },

  async getEconomy(userId: string): Promise<EconomyData> {
    return economyDB.ensure(`${userId}`, defaultEconomy(userId)) as Promise<EconomyData>;
  },

  async updateUsername(userId: string, username: string): Promise<void> {
    const has = await usersDB.has(`${userId}`);
    if (has) await usersDB.set(`${userId}.username`, username);
  },

  xpNeeded(level: number): number {
    return config.economy.xpToLevelUp(level);
  },

  async addXp(userId: string, amount: number): Promise<{ leveledUp: boolean; newLevel?: number }> {
    await usersDB.ensure(`${userId}`, defaultUser(userId, 'global'));
    await usersDB.add(`${userId}.xp`, amount);
    await usersDB.add(`${userId}.totalXp`, amount);
    const user = await usersDB.get(`${userId}`) as UserData;
    const needed = this.xpNeeded(user.level);
    if (user.xp >= needed) {
      const newLevel = user.level + 1;
      await usersDB.set(`${userId}.level`, newLevel);
      await usersDB.set(`${userId}.xp`, user.xp - needed);
      return { leveledUp: true, newLevel };
    }
    return { leveledUp: false };
  },

  async getBalance(userId: string): Promise<{ wallet: number; bank: number }> {
    const eco = await this.getEconomy(userId);
    return { wallet: eco.wallet, bank: eco.bank };
  },

  async addWallet(userId: string, amount: number): Promise<number> {
    await economyDB.ensure(`${userId}`, defaultEconomy(userId));
    const newWallet = await economyDB.add(`${userId}.wallet`, amount);
    if (amount > 0) await economyDB.add(`${userId}.totalEarned`, amount);
    else            await economyDB.add(`${userId}.totalSpent`, -amount);
    await this._updateNetWorth(userId);
    return newWallet;
  },

  async setWallet(userId: string, amount: number): Promise<void> {
    await economyDB.ensure(`${userId}`, defaultEconomy(userId));
    await economyDB.set(`${userId}.wallet`, Math.max(0, amount));
    await this._updateNetWorth(userId);
  },

  async addBank(userId: string, amount: number): Promise<number> {
    await economyDB.ensure(`${userId}`, defaultEconomy(userId));
    const newBank = await economyDB.add(`${userId}.bank`, amount);
    await this._updateNetWorth(userId);
    return newBank;
  },

  async setBank(userId: string, amount: number): Promise<void> {
    await economyDB.ensure(`${userId}`, defaultEconomy(userId));
    await economyDB.set(`${userId}.bank`, Math.max(0, amount));
    await this._updateNetWorth(userId);
  },

  async _updateNetWorth(userId: string): Promise<void> {
    const eco = await economyDB.get(`${userId}`) as EconomyData | null;
    if (!eco) return;
    await economyDB.set(`${userId}.netWorth`, eco.wallet + eco.bank);
  },

  async recordTransaction(userId: string, type: string, amount: number, description: string): Promise<void> {
    await economyDB.ensure(`${userId}`, defaultEconomy(userId));
    const tx = { type, amount, description, timestamp: Date.now() };
    const txs = (await economyDB.get(`${userId}.transactions`) ?? []) as typeof tx[];
    txs.unshift(tx);
    if (txs.length > 20) txs.splice(20);
    await economyDB.set(`${userId}.transactions`, txs);
  },

  async incrementStat(userId: string, statKey: string, by = 1): Promise<number> {
    await usersDB.ensure(`${userId}`, defaultUser(userId, 'global'));
    return usersDB.add(`${userId}.stats.${statKey}`, by);
  },

  async grantAchievement(userId: string, achievementId: string): Promise<boolean> {
    await usersDB.ensure(`${userId}`, defaultUser(userId, 'global'));
    const existing = (await usersDB.get(`${userId}.achievements`) ?? []) as string[];
    if (existing.includes(achievementId)) return false;
    existing.push(achievementId);
    await usersDB.set(`${userId}.achievements`, existing);
    const ach = Object.values(config.achievements).find((a) => a.id === achievementId);
    if (ach?.reward) await this.addWallet(userId, ach.reward);
    logger.info(`Achievement unlocked: ${achievementId} → ${userId}`);
    return true;
  },

  async checkAchievements(userId: string): Promise<string[]> {
    const eco  = await this.getEconomy(userId);
    const user = await this.getUser(userId);
    const unlocked: string[] = [];
    const grant = async (id: string) => { if (await this.grantAchievement(userId, id)) unlocked.push(id); };
    if (eco.wallet >= 100_000)              await grant('richie');
    if (user.level >= 10)                   await grant('level_10');
    if (user.level >= 50)                   await grant('level_50');
    if (user.level >= 100)                  await grant('level_100');
    if ((user.prestige ?? 0) >= 1)          await grant('first_prestige');
    if ((user.stats?.gamesWon ?? 0) >= 50)  await grant('gambling_addict');
    if ((user.stats?.socialActions ?? 0) >= 100) await grant('social_butterfly');
    if ((user.stats?.crimeSuccess ?? 0) >= 25)   await grant('crime_lord');
    if (eco.bank >= config.economy.bankLimit)     await grant('bank_full');
    return unlocked;
  },

  async prestige(userId: string): Promise<number | false> {
    const user = await this.getUser(userId);
    if (user.level < config.economy.maxLevel) return false;
    const newPrestige = (user.prestige ?? 0) + 1;
    await usersDB.set(`${userId}.prestige`, newPrestige);
    await usersDB.set(`${userId}.level`, 1);
    await usersDB.set(`${userId}.xp`, 0);
    await this.setWallet(userId, config.economy.startingBalance);
    await this.grantAchievement(userId, 'first_prestige');
    return newPrestige;
  },

  async recordSocialAction(userId: string, targetId: string, action: string): Promise<void> {
    await actionsDB.ensure(userId, {});
    const key = `${userId}.${action}`;
    await actionsDB.ensure(key, { count: 0, lastUsed: 0, targets: [] });
    await actionsDB.add(`${key}.count`, 1);
    await actionsDB.set(`${key}.lastUsed`, Date.now());
    const targets = (await actionsDB.get(`${key}.targets`) ?? []) as string[];
    if (!targets.includes(targetId)) {
      targets.unshift(targetId);
      if (targets.length > 5) targets.splice(5);
      await actionsDB.set(`${key}.targets`, targets);
    }
  },

  async getSocialStats(userId: string, action: string): Promise<{ count: number; lastUsed: number; targets: string[] }> {
    return (await actionsDB.get(`${userId}.${action}`)) as { count: number; lastUsed: number; targets: string[] }
      ?? { count: 0, lastUsed: 0, targets: [] };
  },

  async getLeaderboard(type = 'netWorth', limit = 10): Promise<Array<{ userId: string; value: number }>> {
    if (type === 'level') {
      const entries = await usersDB.all();
      return entries
        .map(([id, data]) => ({ userId: id, value: (data as UserData).level ?? 1 }))
        .sort((a, b) => b.value - a.value).slice(0, limit);
    }
    if (type === 'gamesWon') {
      const entries = await usersDB.all();
      return entries
        .map(([id, data]) => ({ userId: id, value: (data as UserData).stats?.gamesWon ?? 0 }))
        .sort((a, b) => b.value - a.value).slice(0, limit);
    }
    const entries = await economyDB.all();
    return entries
      .map(([id, data]) => ({ userId: id, value: (data as Record<string, number>)[type] ?? 0 }))
      .sort((a, b) => b.value - a.value).slice(0, limit);
  },

  async getLevelLeaderboard(limit = 10): Promise<Array<{ userId: string; level: number; xp: number }>> {
    const entries = await usersDB.all();
    return entries
      .map(([id, data]) => ({ userId: id, level: (data as UserData).level ?? 1, xp: (data as UserData).xp ?? 0 }))
      .sort((a, b) => b.level !== a.level ? b.level - a.level : b.xp - a.xp)
      .slice(0, limit);
  },

  async getRank(userId: string): Promise<number | null> {
    const lb  = await this.getLeaderboard('netWorth', 9999);
    const idx = lb.findIndex((e) => e.userId === userId);
    return idx === -1 ? null : idx + 1;
  },
};

export default UserManager;
