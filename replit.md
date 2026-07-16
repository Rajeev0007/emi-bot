# Itsuki Bot

A premium Discord economy bot built with TypeScript and Discord.js v14.

## Stack

- **Runtime:** Node.js ≥ 22
- **Language:** TypeScript (compiled to `dist/`)
- **Framework:** Discord.js v14
- **Music:** Lavende
- **Canvas:** node-canvas (for profile cards)
- **Data:** JSON file store (`database/JsonStore.ts`)

## Project structure

```
src/                  ← all TypeScript source
  commands/           ← slash/prefix commands by category
  config/             ← bot config and music source config
  database/           ← JsonStore class (runtime JSON DB)
  events/             ← Discord event listeners
  handlers/           ← command/event/interaction loaders
  interactions/       ← button interaction handlers
  managers/           ← EconomyManager, MusicManager, etc.
  scripts/            ← one-off scripts (emoji upload)
  services/           ← external APIs, profile canvas
  structures/         ← base Command and Event classes
  utils/              ← logger, formatter, helpers
  index.ts            ← entry point
  deploy-commands.ts  ← slash command registration

database/             ← runtime JSON data files (users, economy, etc.)
emojis/               ← emoji PNG assets
dist/                 ← compiled output (generated, do not edit)
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DISCORD_TOKEN` | ✅ | Bot token from Discord Developer Portal |
| `DISCORD_CLIENT_ID` | ✅ | Application/Client ID |
| `DISCORD_GUILD_ID` | ❌ | Dev guild for instant command registration |
| `BOT_OWNERS` | ❌ | Comma-separated owner Discord user IDs |
| `PREFIX` | ❌ | Message command prefix (default: `!`) |

## Scripts

| Command | Description |
|---|---|
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Start compiled bot (`node dist/index.js`) |
| `npm run dev` | Watch mode (recompile + restart on changes) |
| `npm run deploy` | Register slash commands globally |
| `npm run deploy:guild` | Register commands to dev guild instantly |
| `npm run typecheck` | Type-check without emitting |

## How to run

1. Set `DISCORD_TOKEN` and `DISCORD_CLIENT_ID` in Replit Secrets
2. Click **Run** — the workflow runs `node dist/index.js`
3. On first run, slash commands auto-deploy to Discord

## User preferences

- Source code lives in `src/` — keep all `.ts` files there
