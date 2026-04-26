# 13-03 Summary — Ordered Combat Sequence + Ship-to-Ship

Status: ✅ Completed
Date: 2026-04-26

## What shipped

### Backend sequencing + operations
- Added structured operation-step model in `cloud/src/routes/fighters.ts`.
- Added base ordered entry steps in responses:
  1. nav_hazard (placeholder)
  2. limpet_mines (placeholder)
  3. armid_mines (placeholder)
  4. q_cannon (placeholder)
  5. fighters (resolved/awaiting/skipped)
  6. ship_to_ship (resolved/no-op)
- Move and encounter responses now include `operations[]`.

### Automatic ship-to-ship resolution
- Implemented `resolveShipToShipAfterEntry()`:
  - deterministic opponent ordering via `players.created_at`, then `player_id`
  - bounded rounds (max 3 per duel)
  - simple stat-based damage exchange
  - routes ship destruction through `resolveDefeat()` for consistent loot/respawn/news behavior

### Route integration
- Updated `POST /api/player/ship/move`:
  - includes operation log
  - includes ship-to-ship step after movement/fighter outcomes
- Updated `POST /api/fighters/encounter/resolve`:
  - includes operation log
  - runs ship-to-ship after successful sector entry

### Web client visibility
- `SectorView.vue` now stores/displays last entry `operationLog`.
- Player sees sequence steps and status (skipped/resolved/awaiting).

## Verification run
- `cd cloud && npm run typecheck` ✅
- `cd web/game && npx vue-tsc --noEmit` ✅
- `cd web/game && npm run build` ✅

## Notes
- Empty-ship step is scaffolded as `skipped_not_implemented` (no empty-ship model yet).
- Mine and Q-cannon steps are placeholders until 13-04 / 13-05 + TW-14 dependencies.
- Combat math is intentionally tunable and should be balanced with telemetry.
