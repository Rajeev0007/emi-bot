/**
 * @file deploy-commands.ts
 * @description Registers all slash commands with Discord's API.
 */

import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import fs   from 'fs';
import path from 'path';

const token    = process.env.DISCORD_TOKEN ?? '';
const clientId = process.env.DISCORD_CLIENT_ID ?? '';
const guildId  = process.env.DISCORD_GUILD_ID ?? '';

if (!token || !clientId) { console.error('❌ DISCORD_TOKEN and DISCORD_CLIENT_ID must be set.'); process.exit(1); }

const commands: unknown[] = [];
const commandsPath = path.join(__dirname, 'commands');
const categories   = fs.readdirSync(commandsPath).filter((f) => fs.statSync(path.join(commandsPath, f)).isDirectory());

for (const category of categories) {
  const files = fs.readdirSync(path.join(commandsPath, category)).filter((f) => f.endsWith('.js'));
  for (const file of files) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const raw = require(path.join(commandsPath, category, file));
      const command = raw.default ?? raw;
      if (command?.data?.toJSON) { commands.push(command.data.toJSON()); console.log(`✅ ${command.data.name}`); }
    } catch (err) { console.error(`❌ Failed to load ${category}/${file}:`, (err as Error).message); }
  }
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`\n🚀 Deploying ${commands.length} commands…`);
    if (guildId) {
      const data = await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands }) as unknown[];
      console.log(`✅ Deployed ${data.length} commands to guild ${guildId} (instant)`);
    } else {
      const data = await rest.put(Routes.applicationCommands(clientId), { body: commands }) as unknown[];
      console.log(`✅ Deployed ${data.length} commands globally (up to 1h to propagate)`);
    }
  } catch (err) { console.error('❌ Deploy failed:', (err as Error).message); process.exit(1); }
})();
