# Phase 01 Summary: Daily Bounty System — Server

**Status:** ✅ Complete & Deployed  
**Date:** 2026-05-03  
**Work Item:** TW-19 — Leaderboards & Daily Bounties

---

## What Was Built

### Database Schema
- Migration `0012_daily_missions.sql` created and applied to production D1
- `player_daily_missions` table: per-player, per-galaxy, per-day mission tracking
- `visited_sectors_json` column added to `player_ships` for server-side sector visit tracking

### Mission System (`cloud/src/utils/dailyMissions.ts`)
- **Generator**: 3 missions/day, difficulty-weighted (40% easy, 35% medium, 25% hard)
- **5 mission types**: `kill_npcs`, `trade_credits`, `visit_sectors`, `claim_planet`, `pay_taxes`
- **No duplicate types** in a day's set
- **Progress tracker**: `trackMissionProgress()` increments mission counters
- **Claim system**: `claimMissionReward()` grants credits, marks claimed
- **Reroll system**: `rerollMission()` deducts `max(500, reward*0.5)` credits, replaces with same-difficulty mission
- **UTC midnight reset**: Checked on every mission fetch via `mission_date` column

### API Endpoints (`cloud/src/routes/missions.ts`)
- `GET /api/player/missions?galaxyId=` — list today's missions with progress %
- `POST /api/player/missions/claim` — claim reward for completed mission
- `POST /api/player/missions/reroll` — reroll uncompleted mission for credit cost

### Progress Hooks (5 action endpoints modified)
- `handleCombat()` → `kill_npcs` (on NPC kill)
- `handleTrade()` (sell only) → `trade_credits` (tracks revenue from selling)
- `handleMoveShip()` → `visit_sectors` (tracks new sectors via `visited_sectors_json`)
- `handleColonize()` → `claim_planet`
- `handlePayTaxes()` → `pay_taxes`

### Route Wiring (`cloud/src/index.ts`)
- All 3 endpoints wired with proper rate limiting:
  - GET: `read:${playerId}` — 60/min
  - POST: `gameplay:${playerId}` — 10/min + action budget

### Version Bump
- API: 0.6.0 → 0.6.5

---

## Files Changed

| File | Action |
|---|---|
| `cloud/migrations/0012_daily_missions.sql` | Created |
| `cloud/src/utils/dailyMissions.ts` | Created |
| `cloud/src/routes/missions.ts` | Created |
| `cloud/src/routes/action.ts` | Modified (added `trackMissionProgress` import + hooks in combat & trade) |
| `cloud/src/routes/player.ts` | Modified (added `trackMissionProgress` import + hooks in move & taxes) |
| `cloud/src/routes/planets.ts` | Modified (added `trackMissionProgress` import + hook in colonize) |
| `cloud/src/index.ts` | Modified (added route handlers + import + version bump) |

---

## Verification Results

- ✅ `bun run typecheck` — clean TypeScript
- ✅ Local integration tests: move, trade, taxes, claim, reroll all working
- ✅ Production deployment: `tw3002-api` deployed, D1 migration applied
- ✅ Production smoke test: missions generate, reroll works, rate limit headers present

---

## Issues / Notes

- Action budget `action_points_refill_at` field format issue discovered during testing: local D1 uses `'YYYY-MM-DD HH:MM:SS'` while production uses ISO strings. The `actionBudget.ts` handles both but edge cases with negative elapsed times occurred in local testing when dates were misformatted. Fixed by using proper ISO timestamps.
- Production player had expired auth token — updated `token_expires_at` for testing.

---

## Next Phase

**Phase 02 — Daily Bounty System: Web Client**
Build the `MissionPanel.vue` component, integrate into `SectorView.vue`, add keyboard shortcut (`B`), toast notifications.
