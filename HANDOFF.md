# TW 3002 AI — Session Handoff

Date: 2026-04-24
Current version: CLI v0.6.0 | Cloud API v0.1.0
Repo: https://github.com/prillcode/tw-3002-ai

---

## What Was Accomplished This Session

- Cloud mode scaffolding: CloudLoginScreen, CloudSectorScreen, cloud API client
- Turn regeneration: local (on load) + cloud (in GET /api/player/ship)
- npm publish ready: cross-platform wrapper script in cli/bin/tw3002.js
- Fixed SQLite migration bug: ALTER TABLE rejects DEFAULT CURRENT_TIMESTAMP — use TEXT type
- Created planning work items: TW-06, TW-07, TW-08, TW-05 phase plans
- Committed and pushed all changes

---

## Project Architecture

### Monorepo Structure
```
/
├── cli/                    # Ink + Bun terminal game
│   ├── src/
│   │   ├── index.tsx       # Main App component, AppMode routing
│   │   ├── screens/        # One per screen (Welcome, Sector, Market, Combat, CloudSector, etc.)
│   │   ├── components/     # Reusable UI (Box, Text, Menu, ShipStatus, SectorMap, etc.)
│   │   ├── hooks/          # useKeyHandler, useExitHandler, useScreen
│   │   ├── db/             # SQLite init, migrations, save/load
│   │   └── cloud/          # REST API client for cloud mode
│   ├── bin/tw3002.js       # Cross-platform npm entry point
│   └── tw3002              # Compiled binary (~100MB, Linux only)
├── cloud/                  # Cloudflare Worker + D1
│   ├── src/
│   │   ├── index.ts        # Worker router
│   │   ├── routes/         # auth, galaxy, player, action, news
│   │   └── utils/          # cors, auth token verification
│   ├── migrations/         # D1 SQL files
│   ├── scripts/            # Bun seed scripts (generate galaxy SQL)
│   └── wrangler.toml       # Worker config, env vars
├── packages/engine/        # Pure TypeScript game logic
│   ├── src/
│   │   ├── galaxy/         # generator, layout, names
│   │   ├── economy/        # pricing, trade
│   │   ├── combat/         # resolver, encounters
│   │   ├── npcs/           # generator, brain, tick, memory
│   │   ├── ships/          # upgrades, stats
│   │   ├── llm/            # config, provider, cache
│   │   └── state/          # GameStateContainer
│   └── src/index.ts        # All exports
└── .planning/              # Work items and phase plans
```

### Key Constraint: Engine Cannot Run in Worker
The `@tw3002/engine` package uses `process` (Node.js) in `llm/config.ts`. It CANNOT be imported by the Cloudflare Worker. Seed scripts run in Bun locally and generate SQL that is executed against D1. This is documented in both `cli/AGENTS.md` and `cloud/AGENTS.md`.

---

## CLI Patterns (from cli/AGENTS.md)

- State management: AppMode drives `renderContent()` switch. Add new modes there.
- Keyboard: Always use `useKeyHandler` hook. Never raw `useInput`.
- Keys: H=Help, N=Nav, M=Market, D=StarDock, Esc=Back, Q=Quit
- Migrations: Never use `DEFAULT CURRENT_TIMESTAMP` in `ALTER TABLE`. Use TEXT type.
- Paths: Always `os.homedir()`, never `process.env.HOME`.
- Responsive: Wide >=100 cols = 3-column. Narrow <100 = stacked.
- Save data: `~/.tw3002/saves.db`. Config: `~/.tw3002/config.json`.
- Version bumps: Update `src/index.tsx`, `package.json`, `HelpScreen.tsx`.
- Build: `cd cli && bun run build` produces `./tw3002` binary.

---

## Cloud API Endpoints (live at tw3002-api.prilldev.workers.dev)

### Public (no auth)
- GET /health
- GET /api/galaxy — list galaxies
- GET /api/galaxy/:id — galaxy details
- GET /api/galaxy/:id/sectors — all sectors
- GET /api/galaxy/:id/sector?id= — single sector + NPCs
- GET /api/leaderboard?galaxyId=&limit=
- GET /api/news?galaxyId=&limit=

### Auth (no auth required)
- POST /api/auth/register — body: {email}. Returns {token, email}
- POST /api/auth/verify — body: {token}

### Protected (Bearer token)
- GET /api/player — profile
- GET /api/player/ship?galaxyId= — ship + turn regeneration
- POST /api/player/ship — create ship: {galaxyId, shipName, classId}
- POST /api/player/ship/move — jump: {galaxyId, sectorId}
- POST /api/action/trade — {galaxyId, sectorId, commodity, quantity, action}
- POST /api/action/combat — {galaxyId, sectorId, enemyNpcId, playerAction}
- POST /api/news — add news item

---

## Deployed Cloud State

- Galaxy: "The Void — Shared Galaxy" (id=1)
- Sectors: 1,000
- NPCs: 150 (15% density)
- Seed: 42
- URL: https://tw3002-api.prilldev.workers.dev
- D1: tw3002-galaxy (database_id in wrangler.toml)

---

## Known Limitations (from 20260424_cloud-limitations.md)

### P0 — Must Fix
- Trade prices not displayed in cloud mode (need to parse port_inventory_json)
- No StarDocks in cloud (need migration + seed script update + upgrade endpoint)
- NPCs frozen (need rule-based tick endpoint or Cron Trigger)

### P1 — Important
- Port inventory not shared between players (refresh on sector entry)
- Ship stats hardcoded in CloudSectorScreen (need computeEffectiveStats)
- Combat is one-shot (could add narrative strings)

### P2 — Nice to Have
- Navigation log missing in cloud mode
- Help screen not wired in cloud mode
- Leaderboard not displayed in CLI

### P3 — Future
- PvP combat (TW-05)

---

## Planning Work Items (in .planning/)

Execute in this order:

1. TW-06 Cloud Gameplay Limitations (P0)
   - Phase 06-01: Trade prices (1–2h)
   - Phase 06-02: StarDocks (3–4h)
   - Phase 06-03: NPC ticks (6–8h)

2. TW-07 Polish and Balance (P1)
   - Phase 07-01: Port inventory refresh (1–2h)
   - Phase 07-02: Ship stats from class (1–2h)
   - Phase 07-03: Combat narrative (2–3h)

3. TW-08 Navigation, Help, Leaderboard (P2)
   - Phase 08-01: Navigation log (1h)
   - Phase 08-02: Help screen (30m)
   - Phase 08-03: Leaderboard (1–2h)

4. TW-05 PvP Update (P3)
   - Phase 05-01: PvP combat foundation (6–8h)
   - Phase 05-02: Bounty system (5–7h)
   - Phase 05-03: Notifications (4–5h)
   - Phase 05-04: Leaderboards (4–5h)
   - Phase 05-05: Polish (5–7h)

---

## Critical Files for Next Session

- `.planning/TW-06-cloud-gameplay-limitations/phases/06-01-PLAN.md` — start here
- `cli/src/screens/CloudSectorScreen.tsx` — main cloud gameplay screen
- `cli/src/cloud/client.ts` — API client (all endpoints wrapped)
- `cloud/src/routes/action.ts` — trade + combat endpoints
- `cloud/src/routes/player.ts` — ship + move endpoints
- `cloud/src/routes/galaxy.ts` — sector data endpoints
- `cloud/scripts/seed.ts` — galaxy generator (Bun, not Worker)
- `cli/AGENTS.md` — CLI patterns and gotchas
- `cloud/AGENTS.md` — Cloud patterns and gotchas

---

## Testing Commands

```bash
# Local CLI
cd cli && bun run build && ./tw3002

# Cloud API
curl https://tw3002-api.prilldev.workers.dev/health

# D1 migrations
cd cloud
npx wrangler d1 migrations apply tw3002-galaxy --remote
npx wrangler d1 execute tw3002-galaxy --remote --command="SELECT COUNT(*) FROM npcs"

# Deploy Worker
cd cloud && npx wrangler deploy

# Seed galaxy
cd cloud
bun run scripts/seed.ts > scripts/seed.sql
npx wrangler d1 execute tw3002-galaxy --remote --file=scripts/seed.sql
```

---

## Secrets (already set via wrangler secret put)

- OPENROUTER_API_KEY — for NPC LLM decisions
- No ADMIN_SECRET or DISCORD_WEBHOOK_URL set yet

---

## Version Bump Locations

When releasing:
1. cli/src/index.tsx — const VERSION
2. cli/package.json — version field
3. cli/src/screens/HelpScreen.tsx — footer text

---

## Next Immediate Step

Read `.planning/TW-06-cloud-gameplay-limitations/phases/06-01-PLAN.md` and implement trade price display in CloudSectorScreen. Parse `port_inventory_json` from the sector API response and show buy/sell prices in the trade overlay. No server changes needed.
