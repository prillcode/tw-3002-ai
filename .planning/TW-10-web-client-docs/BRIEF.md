# TW-10 — Web Client & Marketing Site

## Objective
Build a web presence for TW 3002 AI: a marketing/docs site and a browser-based game client that interfaces with the existing Cloudflare Worker API. Replace the static `GAME_GUIDE.md` with a living docs site, and give players a way to play in the browser without installing the CLI.

## Domains

| Property | Domain | Stack |
|----------|--------|-------|
| Marketing + Docs | `playtradewars.net` | Astro + `@astrojs/vue` + Tailwind |
| Web Game Client | `portal.playtradewars.net` | Vue 3 + Pinia + Vue Router |
| Cloud API | `api.playtradewars.net` | Existing Cloudflare Worker |

## Architecture

### Monorepo Layout
```
web/
├── main/          # Astro marketing & docs site
│   ├── src/
│   │   ├── content/    # Markdown docs (migrated from GAME_GUIDE.md)
│   │   ├── components/ # Vue islands + Astro components
│   │   ├── layouts/    # Page layouts
│   │   └── pages/      # Routes
│   └── astro.config.mjs
│
├── game/          # Vue 3 SPA game client
│   ├── src/
│   │   ├── stores/     # Pinia stores (auth, galaxy, ship, combat, ui)
│   │   ├── components/ # Game UI components
│   │   ├── views/      # Screens (Sector, Market, Combat, etc.)
│   │   ├── composables/# useApi, useAuth, useGalaxy, etc.
│   │   └── router.ts
│   └── vite.config.ts
│
└── README.md      # Shared architecture notes
```

### Shared Design System
Both sites share a "space terminal" visual identity:
- Dark background (`bg-slate-950` or `bg-black`)
- Cyan/magenta/yellow accents (same palette as CLI)
- Monospace font for game data, sans-serif for marketing copy
- Tailwind CSS for styling across both projects

### API Integration
The web game client uses the same REST API as the CLI:
- `api.playtradewars.net/health`
- `api.playtradewars.net/api/auth/register`
- `api.playtradewars.net/api/galaxy/:id/sectors`
- `api.playtradewars.net/api/player/ship`
- `api.playtradewars.net/api/action/trade`
- `api.playtradewars.net/api/action/combat`
- etc.

Polling strategy: 10–15s when docked/trading, 30s when viewing sector.

## Out of Scope (for TW-10)
- Real-time WebSockets (future optimization)
- PvP in web client (TW-05 dependency)
- Full feature parity with CLI local mode (cloud only for web)
- Mobile app or native clients

## Relevant Files
- `GAME_GUIDE.md` — content to migrate to docs site
- `cli/src/screens/CloudSectorScreen.tsx` — UI behavior to replicate in Vue
- `cli/src/cloud/client.ts` — API client pattern to port
- `cloud/src/index.ts` — CORS needs updating for new origins
- `cloud/src/utils/cors.ts` — origin allowlist
