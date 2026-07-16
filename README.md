# Itsuki Bot

A premium Discord economy bot with gambling, pets, music, anime cards, social actions, leaderboards, and more — built with TypeScript and Discord.js v14.

---

## Features

- 💰 **Economy** — balance, daily/weekly/monthly rewards, work, crime, rob, beg, search
- 🎰 **Gambling** — slots, blackjack, coinflip, dice, roulette, crash, mines
- 🐾 **Pets** — hatch, feed, and level up pets
- 🏪 **Shop & Inventory** — buy items, open crates, manage your inventory
- 🎌 **Anime Cards** — collect waifu/character cards
- 🎵 **Music** — play, queue, loop, shuffle, autoplay (via Lavende)
- 👥 **Social** — hug, kiss, pat, slap, poke, cuddle, and more
- 🏆 **Leaderboard** — top users by balance, level, and more
- 🧑‍💼 **Profiles** — XP, levels, prestige, reputation, achievements
- 🎖️ **Achievements** — unlock badges through gameplay
- 🔧 **Utility** — ping, help, stats, per-server bot branding

---

## Requirements

| Requirement | Version |
|---|---|
| Node.js | ≥ 22.0.0 |
| npm | ≥ 8 |

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/itsuki-bot.git
cd itsuki-bot
```

### 2. Install dependencies

```bash
npm install
```

> ⚠️ **Note:** The `canvas` package requires native build tools.  
> - **Linux/Ubuntu:** `sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev`  
> - **macOS:** `brew install pkg-config cairo pango libpng jpeg giflib librsvg`  
> - **Windows:** Install [windows-build-tools](https://github.com/felixrieseberg/windows-build-tools) or use WSL2.

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_GUILD_ID=your_guild_id_here   # optional, for dev — instant registration
BOT_OWNERS=your_user_id               # optional
```

**How to get these values:**
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application → **Bot** tab → copy the **Token**
3. Copy the **Application ID** from the General Information tab (this is your Client ID)
4. Enable **Privileged Intents**: Server Members Intent, Message Content Intent

### 4. Build the project

```bash
npm run build
```

### 5. Register slash commands

```bash
npm run deploy
```

> If `DISCORD_GUILD_ID` is set, commands register to that guild instantly.  
> Without it, commands register globally (up to 1 hour to propagate).

### 6. Start the bot

```bash
npm start
```

---

## One-liner Setup

```bash
npm run setup && npm run deploy && npm start
```

---

## Hosting Options

### VPS / Dedicated Server (Ubuntu/Debian)

```bash
# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install canvas build deps
sudo apt-get install -y build-essential libcairo2-dev libpango1.0-dev \
  libjpeg-dev libgif-dev librsvg2-dev

# Clone, install, and start
git clone https://github.com/yourusername/itsuki-bot.git && cd itsuki-bot
npm install && npm run build && npm run deploy
npm start
```

**Keep it running with PM2:**

```bash
npm install -g pm2
pm2 start dist/index.js --name itsuki-bot
pm2 save
pm2 startup
```

### Replit

1. Import this repo into Replit
2. Add secrets: `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID`
3. In the Shell: `npm run build && npm run deploy`
4. Set run command to: `node dist/index.js`

### Railway / Render / Fly.io

1. Fork this repo and connect it to your platform
2. Set the environment variables in the platform dashboard
3. Set build command: `npm install && npm run build`
4. Set start command: `node dist/index.js`
5. Run `npm run deploy` once from your local machine to register commands

### Docker

```dockerfile
FROM node:22-alpine

RUN apk add --no-cache cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev \
    python3 make g++

WORKDIR /app
COPY package.json .
RUN npm install

COPY . .
RUN npm run build

CMD ["node", "dist/index.js"]
```

```bash
docker build -t itsuki-bot .
docker run -d --env-file .env --name itsuki-bot itsuki-bot
```

---

## Project Structure

```
itsuki-bot/
├── commands/          # Slash commands, grouped by category
│   ├── anime/
│   ├── economy/
│   ├── gambling/
│   ├── inventory/
│   ├── leaderboard/
│   ├── music/
│   ├── pets/
│   ├── profile/
│   ├── shop/
│   ├── social/
│   └── utility/
├── config/
│   ├── config.ts      # All bot settings (economy, cooldowns, shop items, etc.)
│   └── music.ts       # Music engine settings
├── database/          # JSON flat-file database + store helper
├── events/            # Discord gateway events
├── handlers/          # Command, event, and interaction loaders
├── managers/          # Economy, cooldown, user, and music managers
├── services/          # Anime API, GIF service, profile canvas renderer
├── structures/        # Base Command and Event classes
├── utils/             # Logger, formatter, constants, helpers
├── builders/          # Discord component builders
├── interactions/      # Button interaction handlers
├── source.json        # Music source/client config
├── index.ts           # Entry point
└── deploy-commands.ts # Slash command registration script
```

---

## Configuration

All bot behaviour is controlled by **`config/config.ts`**:

| Section | What it controls |
|---|---|
| `economy` | Starting balance, rewards, cooldown payouts, work jobs, XP/levelling |
| `cooldowns` | Per-command cooldown durations (in ms) |
| `shop` | Shop items, prices, categories |
| `gambling` | Slots symbols, blackjack rules, mines config |
| `pets` | Pet types and stats |
| `achievements` | Achievement definitions and rewards |
| `colors` | Embed colour palette |
| `presence` | Bot status and rotating activities |

---

## Scripts

| Command | Description |
|---|---|
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Start the compiled bot |
| `npm run dev` | Watch mode (recompile + restart on changes) |
| `npm run deploy` | Register slash commands with Discord |
| `npm run typecheck` | Type-check without emitting files |
| `npm run setup` | `npm install` + `npm run build` in one step |

---

## Invite the Bot

Generate an invite URL in the [Developer Portal](https://discord.com/developers/applications):  
**OAuth2 → URL Generator** → scopes: `bot`, `applications.commands` → permissions: `Administrator` (or fine-grained).

---

## License

MIT — do whatever you want with it.
