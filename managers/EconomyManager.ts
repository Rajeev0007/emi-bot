/**
 * @file EconomyManager.ts
 * @description High-level economy operations: income, banking, transfers.
 */

import UserManager  from './UserManager';
import config       from '../config/config';
import fmt          from '../utils/Formatter';
import { getStore } from '../database/JsonStore';

const EconomyManager = {
  async daily(userId: string) {
    const eco       = await UserManager.getEconomy(userId);
    const now       = Date.now();
    const remaining = config.cooldowns.daily - (now - eco.lastDaily);
    if (remaining > 0) return { success: false as const, remaining };

    const streak = (eco.dailyStreak ?? 0) + 1;
    const bonus  = Math.min(streak * 0.05, 0.5);
    const base   = fmt.randomInt(config.economy.daily.min, config.economy.daily.max);
    const amount = Math.floor(base * (1 + bonus));

    await UserManager.addWallet(userId, amount);
    const economyDB = getStore('economy');
    await economyDB.set(`${userId}.lastDaily`, now);
    await economyDB.set(`${userId}.dailyStreak`, streak);
    await UserManager.recordTransaction(userId, 'daily', amount, 'Daily reward');
    await UserManager.grantAchievement(userId, 'first_daily');
    return { success: true as const, amount, streak };
  },

  async weekly(userId: string) {
    const eco       = await UserManager.getEconomy(userId);
    const now       = Date.now();
    const remaining = config.cooldowns.weekly - (now - eco.lastWeekly);
    if (remaining > 0) return { success: false as const, remaining };

    const amount = fmt.randomInt(config.economy.weekly.min, config.economy.weekly.max);
    await UserManager.addWallet(userId, amount);
    const economyDB = getStore('economy');
    await economyDB.set(`${userId}.lastWeekly`, now);
    await UserManager.recordTransaction(userId, 'weekly', amount, 'Weekly reward');
    return { success: true as const, amount };
  },

  async monthly(userId: string) {
    const eco       = await UserManager.getEconomy(userId);
    const now       = Date.now();
    const remaining = config.cooldowns.monthly - (now - eco.lastMonthly);
    if (remaining > 0) return { success: false as const, remaining };

    const amount = fmt.randomInt(config.economy.monthly.min, config.economy.monthly.max);
    await UserManager.addWallet(userId, amount);
    const economyDB = getStore('economy');
    await economyDB.set(`${userId}.lastMonthly`, now);
    await UserManager.recordTransaction(userId, 'monthly', amount, 'Monthly reward');
    return { success: true as const, amount };
  },

  async work(userId: string) {
    const eco       = await UserManager.getEconomy(userId);
    const now       = Date.now();
    const remaining = config.cooldowns.work - (now - eco.lastWork);
    if (remaining > 0) return { success: false as const, remaining };

    const job    = fmt.randomItem(config.economy.workJobs);
    const amount = fmt.randomInt(job.min, job.max);
    await UserManager.addWallet(userId, amount);
    const economyDB = getStore('economy');
    await economyDB.set(`${userId}.lastWork`, now);
    await UserManager.recordTransaction(userId, 'work', amount, `Worked as ${job.name}`);
    return { success: true as const, amount, job: job.name };
  },

  async crime(userId: string) {
    const eco       = await UserManager.getEconomy(userId);
    const now       = Date.now();
    const remaining = config.cooldowns.crime - (now - eco.lastCrime);
    if (remaining > 0) return { success: false as const, remaining };

    const economyDB = getStore('economy');
    await economyDB.set(`${userId}.lastCrime`, now);
    await UserManager.incrementStat(userId, 'crimeCount');

    if (Math.random() < config.economy.crimeSuccessRate) {
      const amount = fmt.randomInt(config.economy.crimeRewards.min, config.economy.crimeRewards.max);
      await UserManager.addWallet(userId, amount);
      await UserManager.recordTransaction(userId, 'crime', amount, 'Successful crime');
      await UserManager.incrementStat(userId, 'crimeSuccess');
      return { success: true as const, amount };
    } else {
      const fine       = fmt.randomInt(config.economy.crimeFines.min, config.economy.crimeFines.max);
      const current    = (await UserManager.getBalance(userId)).wallet;
      const actualFine = Math.min(fine, current);
      await UserManager.addWallet(userId, -actualFine);
      await UserManager.recordTransaction(userId, 'fine', -actualFine, 'Crime fine');
      return { success: false as const, fine: actualFine };
    }
  },

  async beg(userId: string) {
    const eco       = await UserManager.getEconomy(userId);
    const now       = Date.now();
    const remaining = config.cooldowns.beg - (now - eco.lastBeg);
    if (remaining > 0) return { success: false as const, remaining };

    const economyDB = getStore('economy');
    await economyDB.set(`${userId}.lastBeg`, now);

    if (Math.random() < config.economy.begChance) {
      const amount = fmt.randomInt(config.economy.begRewards.min, config.economy.begRewards.max);
      await UserManager.addWallet(userId, amount);
      await UserManager.recordTransaction(userId, 'beg', amount, 'Begged for coins');
      return { success: true as const, amount };
    }
    return { success: false as const };
  },

  async search(userId: string) {
    const eco       = await UserManager.getEconomy(userId);
    const now       = Date.now();
    const remaining = config.cooldowns.search - (now - eco.lastSearch);
    if (remaining > 0) return { success: false as const, remaining };

    const location  = fmt.randomItem(config.economy.searchLocations);
    const found     = Math.random() > config.economy.searchFailChance;
    const economyDB = getStore('economy');
    await economyDB.set(`${userId}.lastSearch`, now);

    if (found) {
      const amount = fmt.randomInt(config.economy.searchRewards.min, config.economy.searchRewards.max);
      await UserManager.addWallet(userId, amount);
      await UserManager.recordTransaction(userId, 'search', amount, `Found coins in ${location}`);
      return { success: true as const, amount, location };
    }
    return { success: false as const, location };
  },

  async rob(attackerId: string, targetId: string) {
    const attackerEco = await UserManager.getEconomy(attackerId);
    const targetEco   = await UserManager.getEconomy(targetId);
    const now         = Date.now();
    const remaining   = config.cooldowns.rob - (now - attackerEco.lastRob);
    if (remaining > 0) return { success: false as const, remaining, reason: 'cooldown' as const };
    if (targetEco.wallet < config.economy.robMinWallet)
      return { success: false as const, reason: 'too_poor' as const };

    await UserManager.incrementStat(attackerId, 'robCount');
    const economyDB = getStore('economy');
    await economyDB.set(`${attackerId}.lastRob`, now);

    if (Math.random() < config.economy.robChance) {
      const pct    = fmt.randomInt(Math.floor(config.economy.robPercent.min * 100), Math.floor(config.economy.robPercent.max * 100)) / 100;
      const stolen = Math.floor(targetEco.wallet * pct);
      await UserManager.addWallet(targetId,   -stolen);
      await UserManager.addWallet(attackerId,  stolen);
      await UserManager.recordTransaction(attackerId, 'rob',   stolen,  `Robbed <@${targetId}>`);
      await UserManager.recordTransaction(targetId,   'robbed', -stolen, `Robbed by <@${attackerId}>`);
      await UserManager.incrementStat(attackerId, 'robSuccess');
      return { success: true as const, stolen };
    } else {
      const fine       = fmt.randomInt(config.economy.robFine.min, config.economy.robFine.max);
      const actualFine = Math.min(fine, attackerEco.wallet);
      await UserManager.addWallet(attackerId, -actualFine);
      await UserManager.recordTransaction(attackerId, 'fine', -actualFine, 'Failed rob attempt');
      return { success: false as const, reason: 'caught' as const, fine: actualFine };
    }
  },

  async deposit(userId: string, amount: number) {
    const { wallet, bank } = await UserManager.getBalance(userId);
    if (amount <= 0)             return { success: false as const, reason: 'invalid_amount' as const };
    if (amount > wallet)         return { success: false as const, reason: 'insufficient_funds' as const };
    if (bank + amount > config.economy.bankLimit)
      return { success: false as const, reason: 'bank_full' as const, maxDeposit: config.economy.bankLimit - bank };
    await UserManager.addWallet(userId, -amount);
    await UserManager.addBank(userId,   amount);
    await UserManager.recordTransaction(userId, 'deposit', amount, 'Deposited to bank');
    return { success: true as const, amount };
  },

  async withdraw(userId: string, amount: number) {
    const { wallet, bank } = await UserManager.getBalance(userId);
    if (amount <= 0)                             return { success: false as const, reason: 'invalid_amount' as const };
    if (amount > bank)                           return { success: false as const, reason: 'insufficient_bank' as const };
    if (wallet + amount > config.economy.maxWallet) return { success: false as const, reason: 'wallet_full' as const };
    await UserManager.addBank(userId,   -amount);
    await UserManager.addWallet(userId,  amount);
    await UserManager.recordTransaction(userId, 'withdraw', amount, 'Withdrew from bank');
    return { success: true as const, amount };
  },

  async transfer(senderId: string, receiverId: string, amount: number) {
    const senderBal = (await UserManager.getBalance(senderId)).wallet;
    if (amount <= 0)          return { success: false as const, reason: 'invalid_amount' as const };
    if (amount > senderBal)   return { success: false as const, reason: 'insufficient_funds' as const };
    if (senderId === receiverId) return { success: false as const, reason: 'self_transfer' as const };
    await UserManager.addWallet(senderId,   -amount);
    await UserManager.addWallet(receiverId,  amount);
    await UserManager.recordTransaction(senderId,   'transfer_out', -amount, `Sent to <@${receiverId}>`);
    await UserManager.recordTransaction(receiverId, 'transfer_in',  amount,  `Received from <@${senderId}>`);
    return { success: true as const, amount };
  },
};

export default EconomyManager;
