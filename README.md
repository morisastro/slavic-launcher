# Slavic Launcher

A Lunar Client–style Minecraft launcher for Windows 10/11. Free, open-source, hobby project.

![Slavic Launcher](https://img.shields.io/badge/Electron-React-blue) ![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-success)

## Features

- **Launch Minecraft** — vanilla + Fabric, versions 1.8.9 → latest
- **Accounts** — Microsoft (official, via device-code OAuth) + offline
- **Mods** — browse & install from Modrinth (Fabric-compatible)
- **Servers** — featured server list from backend
- **Rewards** — redeem codes for cosmetics (earned via Discord)
- **Auto Java** — detect or auto-install Java 8/17/21 (Adoptium)
- **Auto-update** — from GitHub Releases
- **Lunar-like UI** — frameless, dark, sidebar navigation
- **Backend** — PocketBase (users, cosmetics, news, servers, codes) + Discord bot

## Quick start (dev)

```bash
npm install
npm run dev
```

This starts Vite (UI) + Electron together. The window opens at `http://localhost:5173`.

## Build a Windows installer

```bash
npm run dist:win
```

Output lands in `release/`. For auto-update, publish a GitHub Release with the generated `.exe` (configure `build.nsis.publish` in `package.json` with your GitHub repo).

## Backend (PocketBase)

See [`backend/README.md`](backend/README.md). One-time setup:

```bat
cd backend
setup.bat
```

This downloads nothing extra — `pocketbase.exe` is already in `backend/` (downloaded during build). The script creates a superuser, starts the server, and seeds all collections. Default admin: `admin@slavic.local` / `changeme123` (edit `setup.bat`).

Then open http://127.0.0.1:8090/_/ to manage news, servers, cosmetics, and codes. A sample news post, server, and redeem code (`WELCOME10`) are created automatically.

To start again later: `backend\start.bat`.

## Discord bot

See [`backend/bot/.env.example`](backend/bot/.env.example). Provides `/giveaway`, `/code`, `/ping`.

```bash
cd backend/bot
cp .env.example .env   # fill in token + guild id
npm install
npm start
```

## Tech stack

| Part | Tech |
|---|---|
| Launcher | Electron + React + TypeScript + Vite + TailwindCSS |
| Game logic | `@xmcl/core`, `@xmcl/installer`, `@xmcl/user` |
| Mods | Modrinth REST API |
| Backend | PocketBase (Go binary, SQLite) |
| Bot | discord.js |
| Auto-update | electron-updater (GitHub Releases) |

## Project layout

```
slavic-launcher/
├── electron/         # main process + services
│   ├── main.ts
│   ├── preload.ts
│   ├── ipc.ts
│   └── services/     # auth, versions, launcher, modrinth, java, settings
├── src/              # React renderer
│   ├── components/   # TitleBar, Sidebar
│   ├── pages/        # Home, Accounts, Versions, Mods, Servers, Shop, Settings
│   ├── store/        # zustand state
│   └── styles/
├── backend/
│   ├── pb_migrations/ # PocketBase schema
│   └── bot/           # Discord bot
├── package.json
└── vite.config.ts
```

## Roadmap / next steps

- [ ] In-game cosmetics via a Fabric mod (capes, hats rendered client-side)
- [ ] Discord Rich Presence
- [ ] Server status pinging (Minecraft protocol)
- [ ] Custom modpacks (zip install)
- [ ] Screenshot gallery
- [ ] Settings profile presets

## Disclaimer

Minecraft is a trademark of Mojang/Microsoft. This launcher is a hobby project and not affiliated with Mojang. Modifying the client may violate Minecraft's EULA — use at your own discretion.

## License

MIT
