# TW 3002 AI — Web Presence

This directory contains the web-facing properties for TW 3002 AI.

## Structure

```
web/
├── main/     # Astro marketing + docs site → playtradewars.net
└── game/     # Vue 3 SPA game client → portal.playtradewars.net
```

## Design System

Both sites share a "space terminal" visual identity:

- **Background:** `bg-void-950` (#0a0a0f)
- **Accents:** Cyan, magenta, yellow, green, red (same palette as CLI)
- **Fonts:** JetBrains Mono (mono), Inter (sans)
- **Framework:** Tailwind CSS

## Development

### Marketing + Docs (Astro)

```bash
cd web/main
npm install
npm run dev          # localhost:4321
```

### Game Client (Vue 3)

```bash
cd web/game
npm install
npm run dev          # localhost:5173
```

## Environment Variables

Both projects need an `.env` file (see `.env.example` in each directory):

```
VITE_API_URL=https://api.playtradewars.net
```

## Deployment

| Property | Target | Command |
|----------|--------|---------|
| Marketing | Cloudflare Pages (`playtradewars.net`) | `cd web/main && npm run build` |
| Game | Cloudflare Pages (`portal.playtradewars.net`) | `cd web/game && npm run build` |

## Domain Map

| Domain | Service |
|--------|---------|
| `playtradewars.net` | Astro static site (marketing + docs) |
| `portal.playtradewars.net` | Vue SPA (game client) |
| `api.playtradewars.net` | Cloudflare Worker (REST API) |
