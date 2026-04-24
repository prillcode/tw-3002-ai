# CLI Agent Context

Rules, patterns, and gotchas for working on the TW 3002 AI CLI client.

---

## Architecture

- **Frontend:** Ink (React for terminals) + React 19 + Bun
- **Game Engine:** `@tw3002/engine` monorepo package — pure TypeScript, no Node.js deps
- **Persistence:** `bun:sqlite` at `~/.tw3002/saves.db`
- **Cloud Mode:** HTTP client in `src/cloud/client.ts` talks to Cloudflare Worker at `tw3002-api.prilldev.workers.dev`

The engine is **separate from the CLI** so it can (in theory) be reused by a web client or the cloud Worker. In practice, the engine uses `process` (Node.js) in `llm/config.ts`, so it **cannot be imported by the Cloudflare Worker** — seed scripts run in Bun locally and generate SQL.

---

## File Organization

| Directory | Purpose |
|-----------|---------|
| `src/screens/` | One file per screen (Welcome, Sector, Market, Combat, etc.) |
| `src/components/` | Reusable UI (Box, Text, Menu, ShipStatus, SectorMap) |
| `src/hooks/` | `useKeyHandler`, `useExitHandler`, `useScreen` |
| `src/db/` | SQLite init, migrations, save/load |
| `src/cloud/` | REST API client for cloud mode |

Screens export a component + props interface. Components export pure presentational components.

---

## State Management

- `AppMode` in `index.tsx` drives which screen renders. Add new modes to the `renderContent()` switch.
- `prevMode` tracks where you came from for `handleBack()`.
- `shipState` is the single source of truth for player stats (credits, cargo, hull, shield, turns).
- `galaxy`, `npcs`, `news` are fetched/generated once and mutated in place.
- **Always bump `lastActionAt` on save** — drives turn regeneration on next load.

---

## Key Handling

- **Always use `useKeyHandler`** — never raw `useInput` in screens.
- **Register handlers in the hook**, not inline. See `src/hooks/useKeyHandler.ts` for the full list.
- **Context-aware help:** Pressing `H` opens `HelpScreen` with the current `AppMode` context.
- **Status bar items** must match the actual keys. Update `getStatusItems()` in `index.tsx` when adding new keys.

| Key | Convention |
|-----|------------|
| `H` | Help (not `?`) |
| `N` | Navigation Log |
| `M` | Market |
| `D` | StarDock |
| `Esc` | Back / Cancel |
| `Q` | Quit |

---

## Migrations (Critical)

SQLite `ALTER TABLE ADD COLUMN` **rejects non-constant defaults** like `DEFAULT CURRENT_TIMESTAMP`.

```typescript
// ❌ WRONG — crashes on existing databases
sql: `ALTER TABLE saves ADD COLUMN last_action_at DATETIME DEFAULT CURRENT_TIMESTAMP`

// ✅ CORRECT — plain type, app sets the value
sql: `ALTER TABLE saves ADD COLUMN last_action_at TEXT`
```

The application code (saveLoad.ts) always sets values explicitly on INSERT/UPDATE, so no database default is needed.

**Always add new migrations to BOTH:**
1. The `MIGRATIONS` array (drives normal upgrades for tracked databases)
2. The `BASELINE_SQL` string (handles pre-migration-era databases)

The migration runner is idempotent — safe to call on every launch.

---

## Cross-Platform Paths

```typescript
// ❌ WRONG — doesn't exist on Windows
const path = `${process.env.HOME}/.tw3002/saves.db`;

// ✅ CORRECT
import { homedir } from 'os';
const path = `${homedir()}/.tw3002/saves.db`;
```

Same rule applies anywhere you touch the filesystem.

---

## Responsive Layout

- **Wide terminals (≥100 cols):** Three-column layout — ShipStatus | SectorList | SectorMap
- **Narrow terminals (<100 cols):** Stacked — ShipStatus + SectorList above, SectorMap full-width below
- `ShipStatus` has `minWidth={30}`
- `SectorList` is capped at 5 visible neighbors with scroll indicators
- `SectorMap` uses `flexGrow={1}` in narrow mode, no `minWidth` constraint

Never let layout height change between sectors — cap NPC lists (3) and news (2) to prevent screen jumping.

---

## Turn Regeneration

When loading a saved game, always call `regenerateTurns()`:

```typescript
const regen = regenerateTurns(save.turns, save.maxTurns, save.lastActionAt);
// Show message if regen.regenerated > 0
```

Rate: **1 turn per hour** of real idle time. Capped at `maxTurns`.

---

## Cloud Mode

- Cloud login screen: `src/screens/CloudLoginScreen.tsx`
- API client: `src/cloud/client.ts` — wraps `fetch()` with Bearer token auth
- After login, `cloudAuth` state is set; gameplay needs to switch to cloud data sources
- The cloud client is ready but **not fully wired into the game loop yet** — the SectorScreen still uses local `galaxy` state

---

## Version Bumps

Update ALL three locations:
1. `src/index.tsx` — `const VERSION = 'x.y.z'`
2. `package.json` — `"version": "x.y.z"`
3. `src/screens/HelpScreen.tsx` — footer text

Then `bun run build` to compile the binary.

---

## Build & Release

```bash
cd cli
bun run typecheck   # zero errors before commit
bun run build       # produces ./tw3002 (~100MB standalone binary)
```

The binary is self-contained — no runtime needed. Can be copied anywhere.

GitHub Actions release workflow (`.github/workflows/release.yml`) builds Linux, macOS, and Windows binaries on tag push.

---

## NPC Brain Integration

- `loadConfig()` reads `~/.tw3002/config.json` for LLM provider settings
- `testLLMConnection()` runs on startup — shows quote + latency, or warning if disabled
- Invalid configs fall back silently to rule-based NPCs — never block play
- The CLI does NOT call OpenRouter directly for NPC decisions; it uses the engine's `tickNPCs()` which handles LLM or rule-based logic

---

## Navigation Log

- Track `visitedSectorIds` as an array of sector IDs
- `-1` is a blast marker (ship destroyed separator)
- `startingSectorId` resets on death (to FedSpace respawn point)
- `navPaused` pauses tracking while in FedSpace after respawn; resumes on first non-FedSpace jump

---

## Save/Load Contract

`saveGame()` serializes:
- `shipName`, `credits`, `currentSector`, `cargo`, `hull`, `shield`, `turns`, `maxTurns`
- `shipClassId`, `upgradesJson` (stringified)
- `galaxyJson`, `npcsJson` (stringified)
- `lastActionAt` (ISO string)

`loadGame()` deserializes everything, then reconstructs the `Galaxy` (Map from JSON) and `NPC[]`.

---

## Things to Avoid

- **Don't add `process.env.HOME`** — use `os.homedir()`
- **Don't use `DEFAULT CURRENT_TIMESTAMP` in `ALTER TABLE`** — SQLite rejects it
- **Don't call LLM APIs from the Worker** — engine uses Node.js APIs; use seed scripts instead
- **Don't let screen height vary between sectors** — cap lists to fixed sizes
- **Don't forget to update status bar items** when adding new keys

---

*This doc is for AI agents. Players should read GAME_GUIDE.md. Contributors should read README.md.*
