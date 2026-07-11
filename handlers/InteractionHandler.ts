/**
 * @file InteractionHandler.ts
 * @description Routes button/modal/select-menu interactions to their handlers.
 */

import fs   from 'fs';
import path from 'path';
import { type Client, type Interaction } from 'discord.js';
import logger from '../utils/Logger';

interface InteractionModule {
  customId: string;
  execute:  (interaction: Interaction, client: Client) => Promise<void>;
}

export default class InteractionHandler {
  client:  Client;
  buttons: Map<string, InteractionModule>;
  modals:  Map<string, InteractionModule>;
  menus:   Map<string, InteractionModule>;

  constructor(client: Client) {
    this.client  = client;
    this.buttons = new Map();
    this.modals  = new Map();
    this.menus   = new Map();
  }

  load(): void {
    this._loadDir('buttons',      this.buttons);
    this._loadDir('modals',       this.modals);
    this._loadDir('stringMenus',  this.menus);
    this._loadDir('userMenus',    this.menus);
    this._loadDir('roleMenus',    this.menus);
    this._loadDir('channelMenus', this.menus);
  }

  private _loadDir(subdir: string, map: Map<string, InteractionModule>): void {
    const dir = path.join(__dirname, '../interactions', subdir);
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js'));
    for (const file of files) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const raw = require(path.join(dir, file));
        const mod = (raw.default ?? raw) as InteractionModule;
        if (mod.customId && mod.execute) {
          map.set(mod.customId, mod);
          logger.debug(`[InteractionHandler] Loaded ${subdir}/${file} → ${mod.customId}`);
        }
      } catch (err) {
        logger.error(`[InteractionHandler] Failed to load ${subdir}/${file}:`, (err as Error).message);
      }
    }
  }

  async handle(interaction: Interaction): Promise<void> {
    let map: Map<string, InteractionModule> | null = null;
    if ((interaction as { isButton?: () => boolean }).isButton?.())           map = this.buttons;
    else if ((interaction as { isModalSubmit?: () => boolean }).isModalSubmit?.()) map = this.modals;
    else if ((interaction as { isAnySelectMenu?: () => boolean }).isAnySelectMenu?.()) map = this.menus;
    if (!map) return;

    const rawId = (interaction as { customId?: string }).customId ?? '';
    let handler = map.get(rawId);
    if (!handler) {
      for (const [key, h] of map) {
        if (key.endsWith(':*') && rawId.startsWith(key.slice(0, -2))) {
          handler = h;
          break;
        }
      }
    }

    if (!handler) {
      // No handler found — acknowledge the interaction to prevent "This interaction failed" in Discord
      logger.debug(`[InteractionHandler] No handler found for "${rawId}" — deferring update.`);
      const i = interaction as any;
      try {
        if (!i.replied && !i.deferred) {
          await i.deferUpdate();
        }
      } catch { /* interaction may have expired */ }
      return;
    }

    try {
      await handler.execute(interaction, this.client);
    } catch (err) {
      logger.error(`[InteractionHandler] Error handling ${rawId}:`, (err as Error).message);
      logger.debug((err as Error).stack ?? '');
      const msg = { content: '❌ An error occurred processing this interaction.', ephemeral: true };
      const i = interaction as any;
      if (i.replied || i.deferred) await i.followUp(msg).catch(() => {});
      else                          await i.reply(msg).catch(() => {});
    }
  }
}
