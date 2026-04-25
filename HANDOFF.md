# TW 3002 AI — Session Handoff

Date: 2026-04-24
Current version: CLI v0.6.0 | Cloud API v0.1.0
Repo: https://github.com/prillcode/tw-3002-ai

---

## What Was Accomplished This Session

### TW-06 Cloud Gameplay Limitations (P0) — COMPLETE

**06-01 Trade Prices**
- `CloudSectorScreen` now parses `port_inventory_json` from `cloudGetSector()`
- Trade overlay displays buy/sell prices, supply, and owned cargo for all 3 commodities
- Profit indicators (▲/▼) shown when player has cargo, comparing current price to `BASE_PRICES`
- Client-side validation in `handleTrade()` prevents overspending, overbuying, and exceeding cargo space
- Ship cargo and sector inventory refresh after every trade

**06-02 StarDocks**
- D1 migration `0002_stardocks.sql` applied to cloud DB
- `cloud/scripts/seed.ts` updated to pick 3–5 stardock sectors per galaxy
- Targeted UPDATE applied to existing galaxy (sectors 13, 250, 500, 750 are now stardocks)
- `buildGalaxyFromCloud()` populates `galaxy.stardocks` from DB flag
- Cloud API `GET /api/galaxy/:id/sectors` returns `stardock` column
- New endpoint `POST /api/action/upgrade` validates stardock presence, upgrade prerequisites, and credits
- Worker uses self-contained `cloud/src/upgrades.ts` (no Node.js `process` import issues)
- CLI `D` key opens upgrade menu at stardock sectors
- `computeEffectiveStats()` used in `loadShip()` to set correct maxCargo/maxHull/maxShield/maxTurns per class + upgrades
- Upgrade purchase refreshes ship stats client-side immediately

**06-03 NPC Ticks**
- New `cloud/src/routes/npc.ts` with rule-based NPC tick system
- `POST /api/npc/tick` endpoint (admin-only via `X-Admin-Secret`)
- Cron Trigger configured in `wrangler.toml` to run every 5 minutes
- NPCs move (60% chance), trade at ports (30% if trader), attack each other (raiders/patrols)
- News items generated for NPC deaths
- Worker `scheduled` handler added to `cloud/src/index.ts`
- `ADMIN_SECRET` set in Worker secrets

### TW-07 Polish and Balance (P1) — COMPLETE

**07-01 Port Inventory Refresh**
- Already implemented via `loadSector()` calls on jump and after trade
- Supply visible in trade overlay and updates in real-time

**07-02 Ship Stats from Class + Upgrades**
- `loadShip()` now parses `upgrades_json` and calls `computeEffectiveStats()`
- No hardcoded stats remain in `CloudShipState`
- Merchant/Scout/Interceptor classes have distinct base stats
- Upgrades apply immediately (tested: Cargo Holds Mk I adds +30 cargo)

**07-03 Combat Narrative**
- `handleCombat()` returns `narrative` field with contextual story text
- 5+ narrative templates per action type (attack-won, attack-lost, attack-survived, flee-success, flee-fail, flee-death, bribe)
- Narrative uses enemy persona name for personalization
- CLI displays narrative in combat result message

### TW-08 Navigation, Help, Leaderboard (P2) — COMPLETE

**08-01 Navigation Log**
- `visitedSectorIds` state tracks flight history
- `-1` appended on ship destruction as blast marker
- `N` key opens `NavigationScreen` with breadcrumb trail and visited sectors
- Blast markers visually separate life segments

**08-02 Help Screen**
- Added `'cloud'` context to `HelpScreen.tsx` with all cloud controls
- `H` key opens cloud-specific help from `CloudSectorScreen`
- Controls documented: jump, market, stardock, nav log, help, quit

**08-03 Leaderboard**
- New `LeaderboardScreen.tsx` component fetches `cloudGetLeaderboard(galaxyId, 10)`
- Displays rank, ship name, class, net worth, kills, deaths
- Current player highlighted with ★
- `L` key opens leaderboard from `CloudSectorScreen`
- `onL` added to `useKeyHandler` hook

### TW-10 Web Client & Docs Site (Scaffolded)

**Architecture decided and scaffolded:**
- `web/main/` — Astro marketing + docs site → `playtradewars.net`
- `web/game/` — Vue 3 SPA game client → `portal.playtradewars.net`
- Shared design system: Tailwind with "space terminal" palette

**Created:**
- `web/main/` — Astro project with Vue integration, Tailwind, content collections
  - Landing page with hero, features, platform cards
  - Guide pages migrated from GAME_GUIDE.md (getting-started, trading, combat, stardock, keyboard)
  - `TerminalHeader.vue` component
- `web/game/` — Vue 3 project with Pinia, Vue Router, Tailwind
  - Auth store with localStorage persistence
  - Galaxy store with sector/neighbor logic
  - Ship store with load/create/move
  - UI store for modals
  - `LoginView.vue` — registration + ship creation
  - `SectorView.vue` — main game screen with ship status, warp lanes, actions
  - Placeholder views for Market, Combat, StarDock, Navigation, Leaderboard
- `cloud/src/utils/cors.ts` — origin-based CORS with `applyCors()` helper
- `cloud/src/index.ts` — all responses wrapped with origin-restricted CORS
- `.planning/TW-10-web-client-docs/` with BRIEF.md, ROADMAP.md, and phase plans

**Domains:**
- `playtradewars.net` — marketing/docs
- `portal.playtradewars.net` — game client
- `api.playtradewars.net` — Cloudflare Worker API (CORS updated)

---

## Testing Commands

```bash
# Local CLI
cd cli && bun run build && ./tw3002

# Cloud API health
curl https://tw3002-api.prilldev.workers.dev/health

# Sector with stardock
curl "https://tw3002-api.prilldev.workers.dev/api/galaxy/1/sector?id=13" | jq '.sector.stardock'

# Admin NPC tick (needs token + admin secret)
curl -X POST "https://tw3002-api.prilldev.workers.dev/api/npc/tick" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "X-Admin-Secret: test-admin-123" \
  -H "Content-Type: application/json" \
  -d '{"galaxyId":1}'

# Leaderboard
curl "https://tw3002-api.prilldev.workers.dev/api/leaderboard?galaxyId=1&limit=10"

# Deploy Worker
cd cloud && npx wrangler deploy

# Build CLI
cd cli && bun run build

# Web dev servers
cd web/main && npm install && npm run dev    # localhost:4321
cd web/game && npm install && npm run dev    # localhost:5173
```

---

## Next Immediate Step

**TW-10 Phase 01** — Get Astro docs site building: `cd web/main && npm install && npm run dev`

After that:
- Phase 02: Get Vue game client building and auth flow working
- Phase 03: Deploy both to Cloudflare Pages with custom domains

---

## Key Files Modified This Session

- `cli/src/screens/CloudSectorScreen.tsx` — trade, stardock, nav, help, leaderboard, combat narrative
- `cli/src/screens/HelpScreen.tsx` — added `cloud` context
- `cli/src/screens/LeaderboardScreen.tsx` — new
- `cli/src/hooks/useKeyHandler.ts` — added `onL`
- `cli/src/cloud/client.ts` — added `cloudUpgrade`, `narrative` in combat
- `cloud/src/index.ts` — added upgrade route, NPC tick route, scheduled handler, CORS wrapper
- `cloud/src/routes/action.ts` — added `handleUpgrade`, combat narrative
- `cloud/src/routes/npc.ts` — new rule-based NPC tick system
- `cloud/src/routes/galaxy.ts` — added `stardock` to sector queries
- `cloud/src/upgrades.ts` — new self-contained upgrade catalog
- `cloud/src/utils/cors.ts` — origin-based CORS
- `cloud/wrangler.toml` — added Cron Trigger (`*/5 * * * *`)
- `cloud/migrations/0002_stardocks.sql` — new migration
- `cloud/scripts/seed.ts` — stardock column in INSERTs
- `cloud/scripts/set_stardocks.sql` — targeted update for existing DB
- `web/main/` — new Astro marketing + docs site
- `web/game/` — new Vue 3 SPA game client
- `.planning/TW-10-web-client-docs/` — planning work item

---

## Deployed Cloud State

- Galaxy: "The Void — Shared Galaxy" (id=1)
- StarDocks: sectors 13, 250, 500, 750
- NPC Cron: fires every 5 minutes
- Admin secret: set
- CORS: allows `playtradewars.net`, `portal.playtradewars.net`, localhost dev
- URL: https://tw3002-api.prilldev.workers.dev
