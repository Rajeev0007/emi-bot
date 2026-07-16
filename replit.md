# Itsuki Bot

A premium Discord economy bot built with TypeScript and Discord.js v14.

## Stack
- **Runtime:** Node.js 22+
- **Language:** TypeScript
- **Library:** discord.js v14
- **Music:** Lavende (in-process voice engine)
- **Database:** JSON flat-file via JsonStore
- **Canvas:** node-canvas (for profile image rendering)

## How to run on Replit

1. Add secrets: `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID` (optional)
2. In Shell: `npm install && npm run build`
3. Register commands: `npm run deploy`
4. Start: `node dist/index.js`

## Key files
- `config/config.ts` — all bot settings (economy, cooldowns, shop, gambling, etc.)
- `config/music.ts` — music engine settings
- `index.ts` — entry point
- `deploy-commands.ts` — registers slash commands with Discord

## User Preferences
- Project name: Itsuki Bot
- Keep existing file structure and stack
- No Replit-specific lock files or registry URLs
