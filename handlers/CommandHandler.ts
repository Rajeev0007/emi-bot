/**
 * @file CommandHandler.ts
 * @description Dynamically loads all commands from the commands/ directory.
 */

import fs   from 'fs';
import path from 'path';
import { type Client, Collection } from 'discord.js';
import { Command } from '../structures/Command';
import logger from '../utils/Logger';

export default class CommandHandler {
  client: Client & { commands?: Collection<string, Command> };

  constructor(client: Client) {
    this.client = client;
  }

  load(): void {
    const commandsPath = path.join(__dirname, '../commands');
    const categories   = fs.readdirSync(commandsPath);
    let count = 0;

    for (const category of categories) {
      const catPath = path.join(commandsPath, category);
      if (!fs.statSync(catPath).isDirectory()) continue;

      const files = fs.readdirSync(catPath).filter((f) => f.endsWith('.js'));

      for (const file of files) {
        const filePath = path.join(catPath, file);
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const mod = require(filePath);
          const command = (mod.default ?? mod) as Command;
          if (!command?.data || !command?.execute) {
            logger.warn(`[CommandHandler] Skipping ${file} — missing data or execute`);
            continue;
          }
          command.category = category;
          (this.client as Client & { commands: Collection<string, Command> }).commands.set(command.name, command);
          count++;
          logger.debug(`[CommandHandler] Loaded /${command.name} (${category})`);
        } catch (err) {
          logger.error(`[CommandHandler] Failed to load ${file}:`, (err as Error).message);
        }
      }
    }

    logger.info(`[CommandHandler] Loaded ${count} commands across ${categories.length} categories`);
  }
}
