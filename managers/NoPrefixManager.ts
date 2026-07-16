/**
 * @file NoPrefixManager.ts
 * @description Manages the NoPrefix premium list.
 *
 * Users on this list can run any command without typing the bot prefix —
 * e.g. typing "balance" works the same as "!balance".
 *
 * The list is stored in database/noprefix.json and mirrored to an in-memory
 * Set so `has()` lookups are synchronous (O(1)) with zero DB overhead on every
 * message.
 */

import { getStore } from '../database/JsonStore';
import logger       from '../utils/Logger';

interface NoPrefixEntry {
  username: string;
  addedAt:  number;
}

class NoPrefixManager {
  private readonly _db    = getStore('noprefix');
  private readonly _cache = new Map<string, NoPrefixEntry>(); // userId → entry
  private _loaded         = false;
  private _loadPromise: Promise<void>;

  constructor() {
    this._loadPromise = this._load();
  }

  // ── Internal ─────────────────────────────────────────────────────────────

  private async _load(): Promise<void> {
    try {
      const raw = (await this._db.get()) as Record<string, NoPrefixEntry> | null;
      if (raw && typeof raw === 'object') {
        for (const [id, entry] of Object.entries(raw)) {
          if (entry && typeof entry === 'object') {
            this._cache.set(id, entry);
          }
        }
      }
      this._loaded = true;
      logger.debug(`[NoPrefix] Loaded ${this._cache.size} entries from disk.`);
    } catch (err) {
      logger.error('[NoPrefix] Failed to load noprefix.json:', (err as Error).message);
    }
  }

  /** Call once on startup so the cache is warm before messageCreate runs. */
  async ready(): Promise<void> {
    return this._loadPromise;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Synchronous O(1) check — safe to call inside messageCreate with no await.
   * Returns false if the list hasn't loaded yet (conservative default).
   */
  has(userId: string): boolean {
    return this._cache.has(userId);
  }

  async add(userId: string, username: string): Promise<boolean> {
    if (this._cache.has(userId)) return false; // already there
    const entry: NoPrefixEntry = { username, addedAt: Date.now() };
    this._cache.set(userId, entry);
    await this._db.set(userId, entry);
    return true;
  }

  async remove(userId: string): Promise<boolean> {
    if (!this._cache.has(userId)) return false;
    this._cache.delete(userId);
    await this._db.delete(userId);
    return true;
  }

  list(): Array<{ userId: string; username: string; addedAt: number }> {
    return [...this._cache.entries()].map(([userId, entry]) => ({
      userId,
      ...entry,
    }));
  }

  count(): number {
    return this._cache.size;
  }
}

export default new NoPrefixManager();
