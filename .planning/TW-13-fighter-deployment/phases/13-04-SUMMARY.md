# 13-04 Summary — Mines (Limpet + Armid)

Status: ✅ Completed
Date: 2026-04-26

## What shipped

### Schema
- Added migration: `cloud/migrations/0005_mines_blockades.sql`
  - `player_ships.limpets`
  - `player_ships.armids`
  - `player_ships.limpet_attached`
  - `sector_mines` table + indexes

### Backend
- Added `cloud/src/routes/mines.ts` with endpoints:
  - `POST /api/mines/buy`
  - `POST /api/mines/deploy`
  - `GET /api/mines/sector`
  - `POST /api/mines/clear-limpets`
- Added entry-mine resolver `applyMineEntryEffects()`
  - limpet attach before fighter stage
  - armid detonation + hull damage before fighter stage
  - destruction routes through `resolveDefeat()`
- Integrated mine entry effects into `/api/player/ship/move` before fighter encounter handling.

### Web client
- Ship state expanded:
  - limpets, armids, limpetAttached
- StarDock now supports:
  - buying limpets/armids
  - clearing attached limpets (with cost)
- Sector view now supports:
  - deploying limpets/armids
  - mine presence indicators
  - limpet attached warning in ship panel

## Verification run
- `cd cloud && npm run typecheck` ✅
- `cd web/game && npx vue-tsc --noEmit` ✅
- `cd web/game && npm run build` ✅

## Notes
- Mine formulas are intentionally tunable for balance iteration.
- Limpet movement penalties are not yet modeled beyond attachment tracking/warnings.
