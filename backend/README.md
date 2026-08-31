# Slavic Launcher — Backend (Node.js + Express)

Simple, fast, no Docker, no external database.

## Quick start (local)

```bash
cd backend
npm install
npm start
```

Backend runs at http://127.0.0.1:8090

## Deploy on Render

Render reads `render.yaml` — auto-detects Docker service.

## Admin Panel

Open `https://slavic-launcher-backend.onrender.com/` in your browser.
Login with admin key: `slavic-admin-2024`

## API

### Public (no auth)

| Method | Route | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/news` | News feed |
| GET | `/api/servers` | Server list |
| GET | `/api/cosmetics` | Cosmetics catalog |
| POST | `/api/redeem` | Redeem a code `{ code, user }` |
| GET | `/api/user-cosmetics/:uuid` | User's cosmetics |
| GET | `/download` | Redirect to latest launcher download |

### Admin (requires `x-admin-key` header)

| Method | Route | Description |
|---|---|---|
| POST | `/api/admin/news` | Create news |
| DELETE | `/api/admin/news/:id` | Delete news |
| POST | `/api/admin/servers` | Create server |
| DELETE | `/api/admin/servers/:id` | Delete server |
| POST | `/api/admin/cosmetics` | Create cosmetic |
| POST | `/api/admin/codes` | Create redeem code `{ code, reward, maxUses }` (0=infinite) |
| GET | `/api/admin/codes` | List all codes |
| GET | `/api/admin/users` | List all users |

## Storage

Local JSON file (`backend/data/db.json`). Auto-seeds sample data on first run.
Note: on Render free tier, data resets on redeploy.