/**
 * @file CooldownManager.ts
 * @description Per-user, per-command cooldown tracking with in-memory Map.
 */

class CooldownManager {
  private _store = new Map<string, number>();

  private _key(userId: string, commandName: string): string {
    return `${userId}:${commandName}`;
  }

  check(userId: string, commandName: string): { onCooldown: boolean; remaining: number } {
    const key     = this._key(userId, commandName);
    const expiry  = this._store.get(key);
    if (!expiry) return { onCooldown: false, remaining: 0 };
    const remaining = expiry - Date.now();
    if (remaining <= 0) {
      this._store.delete(key);
      return { onCooldown: false, remaining: 0 };
    }
    return { onCooldown: true, remaining };
  }

  set(userId: string, commandName: string, durationMs: number): void {
    const key = this._key(userId, commandName);
    this._store.set(key, Date.now() + durationMs);
    setTimeout(() => this._store.delete(key), durationMs);
  }

  clear(userId: string, commandName: string): void {
    this._store.delete(this._key(userId, commandName));
  }

  purge(): void {
    const now = Date.now();
    for (const [key, expiry] of this._store) {
      if (expiry <= now) this._store.delete(key);
    }
  }
}

export default new CooldownManager();
