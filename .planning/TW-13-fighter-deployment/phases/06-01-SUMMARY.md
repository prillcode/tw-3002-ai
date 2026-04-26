# 06-01 Summary — Fighter Purchase & Deployment

Status: ✅ Completed
Date: 2026-04-26

## What shipped

### Backend (Cloud Worker)
- Added migration `cloud/migrations/0004_fighters.sql`
  - `player_ships.fighters` column (`INTEGER NOT NULL DEFAULT 0`)
  - `sector_fighters` table with owner/mode/count
  - lookup indexes
- Added new route module `cloud/src/routes/fighters.ts`
  - `POST /api/fighters/buy`
  - `POST /api/fighters/deploy`
  - `GET /api/fighters/sector`
  - `POST /api/fighters/recall`
- Wired routes in `cloud/src/index.ts`
- Updated ship creation in `cloud/src/routes/player.ts`
  - new ships now start with **30 fighters** (TW2002-authentic)

### Web Client (Vue)
- Added fighter state + API methods to `web/game/src/stores/ship.ts`
  - `fighters` field on ship state
  - `buyFighters()`, `deployFighters()`, `recallFighters()`
- Added `web/game/src/components/DeployFightersModal.vue`
  - quantity selector + mode chooser (defensive/offensive/tolled)
- Updated `web/game/src/views/StarDockView.vue`
  - new **Fighter Bay** section
  - buy fighters UI + credit checks
- Updated `web/game/src/views/SectorView.vue`
  - fighter counts in ship panel (carried/deployed)
  - sector fighter indicators (hostile + own deployed)
  - deploy action button + modal
  - recall-all action/button
  - keyboard shortcuts: `F` deploy, `R` recall
  - loads fighter presence from `/api/fighters/sector`

## Verification run
- `cd cloud && npm run typecheck` ✅
- `cd web/game && npx vue-tsc --noEmit` ✅
- `cd web/game && npm run build` ✅

## Notes
- Deployment is blocked in FedSpace (`danger = safe`) as planned.
- Fighter ownership is individual-only (no corp sharing).
- This phase does not yet resolve fighter encounters on sector entry (Phase 2).
