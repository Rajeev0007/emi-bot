# Itsuki Bot

A premium Discord economy bot built with TypeScript and Discord.js v14.

## Stack

- **Runtime:** Node.js ≥ 22
- **Language:** TypeScript → compiled to `dist/`
- **Framework:** Discord.js v14
- **Music:** Lavende
- **Canvas:** node-canvas (profile cards)
- **Data:** JSON file store (`database/`)

## Project structure

```
index.ts              ← entry point
deploy-commands.ts    ← slash command registration
commands/             ← commands by category (economy, gambling, music…)
config/               ← bot config and music source config
database/             ← JsonStore.ts + all runtime JSON data files
events/               ← Discord event listeners
handlers/             ← command/event/interaction loaders
interactions/         ← button handlers
managers/             ← EconomyManager, MusicManager, etc.
scripts/              ← one-off scripts (emoji upload)
services/             ← external APIs, profile canvas
structures/           ← base Command and Event classes
utils/                ← logger, formatter, helpers
builders/             ← Discord component builders
emojis/               ← emoji PNG assets
dist/                 ← compiled output (mirrors source, do not edit)
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DISCORD_TOKEN` | ✅ | Bot token from Discord Developer Portal |
| `DISCORD_CLIENT_ID` | ✅ | Application/Client ID |
| `DISCORD_GUILD_ID` | ❌ | Dev guild for instant command registration |
| `BOT_OWNERS` | ❌ | Comma-separated owner Discord user IDs |
| `PREFIX` | ❌ | Message command prefix (default: `!`) |

## Hosting (any server/VPS)

```bash
npm install          # install dependencies
npm run build        # compile TypeScript → dist/
node dist/index.js   # start the bot
```

One-liner: `npm install && npm run build && node dist/index.js`

## Scripts

| Command | Description |
|---|---|
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Start compiled bot |
| `npm run dev` | Watch mode (recompile + restart) |
| `npm run deploy` | Register slash commands globally |
| `npm run deploy:guild` | Register to dev guild instantly |

## User preferences

- Flat structure — source files live at root, not inside a `src/` folder
