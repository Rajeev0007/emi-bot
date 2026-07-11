/**
 * @file Formatter.ts
 * @description Utility functions for formatting numbers, time, and text.
 */

import config from '../config/config';

const Formatter = {
  coins(n: number): string {
    return `${Number(n).toLocaleString('en-US')} ${config.economy.currency}`;
  },

  number(n: number): string {
    return Number(n).toLocaleString('en-US');
  },

  compact(n: number): string {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)         return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  },

  duration(ms: number): string {
    const secs = Math.floor(ms / 1000);
    const mins = Math.floor(secs / 60);
    const hrs  = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `${days}d ${hrs % 24}h ${mins % 60}m`;
    if (hrs  > 0) return `${hrs}h ${mins % 60}m ${secs % 60}s`;
    if (mins > 0) return `${mins}m ${secs % 60}s`;
    return `${secs}s`;
  },

  relativeTime(date: Date | number): string {
    const ts = Math.floor(new Date(date).getTime() / 1000);
    return `<t:${ts}:R>`;
  },

  fullTime(date: Date | number): string {
    const ts = Math.floor(new Date(date).getTime() / 1000);
    return `<t:${ts}:F>`;
  },

  capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  truncate(str: string, max = 100): string {
    return str.length > max ? str.slice(0, max - 3) + '...' : str;
  },

  randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  randomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  weightedRandom<T>(items: T[], weights: number[]): T {
    const total = weights.reduce((a, b) => a + b, 0);
    let rand    = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
      rand -= weights[i];
      if (rand <= 0) return items[i];
    }
    return items[items.length - 1];
  },

  ordinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  },

  parseAmount(input: string | null | undefined, max: number): number | null {
    if (!input) return null;
    const s = String(input).toLowerCase().trim();
    if (s === 'all')  return max;
    if (s === 'half') return Math.floor(max / 2);
    const m = s.match(/^(\d+(?:\.\d+)?)(k|m|b)?$/);
    if (!m) return null;
    const num = parseFloat(m[1]);
    const mul = ({ k: 1_000, m: 1_000_000, b: 1_000_000_000 } as Record<string, number>)[m[2]] ?? 1;
    return Math.floor(num * mul);
  },
};

export default Formatter;
