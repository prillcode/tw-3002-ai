# 15-01 Summary — Alignment Tracking & Faction Standing

Status: ✅ Implemented (foundation)

## What shipped

### Schema
- Added migration `cloud/migrations/0009_alignment.sql`:
  - `player_ships.alignment` (default 0)
  - `player_ships.experience` (default 0)
  - `player_ships.rank` (default 1)
  - `player_ships.commissioned` (default 0)

### Backend alignment system
- Added `cloud/src/utils/alignment.ts`:
  - 22-rank table
  - alignment clamp `[-1000, +1000]`
  - faction standing derivation (CHOAM Friendly / Outlaw / etc.)
  - shared progression updater (`applyAlignmentAndExperience`)
- Added API endpoints:
  - `GET /api/player/alignment?galaxyId=`
  - `POST /api/player/pay-taxes`
  - `POST /api/player/commission`
- Added route wiring in `cloud/src/index.ts`

### Action hooks
- Trade grants experience:
  - buy: +exp from spend
  - sell: +exp from revenue
- NPC combat grants alignment + exp based on enemy faction:
  - Sardaukar kill => positive alignment
  - Fremen / CHOAM / Guild / Independent kills => alignment penalties
- PvP defeat pipeline now adjusts attacker alignment based on victim alignment and awards combat XP.

### Planet hooks
- Planet creation grants alignment/experience (investment tracked)
- Citadel advancement grants alignment/experience

### Faction behavior hooks
- Fremen neutrality (fighter toll): evil-aligned intruders (`<= -100`) are not tolled by evil/fremen-aligned fighter owners.
- Sardaukar aggression increased in direct NPC combat actions vs non-evil players (reduced flee odds, bribe rejection behavior).

### Web client updates
- Sector status panel now displays:
  - alignment (+/- and label)
  - faction standing
  - rank title
- StarDock now includes CHOAM Alignment Services:
  - pay tariffs action
  - request Guild Commission action
- Ship store stats expanded with alignment/rank/experience/commission data from API.

## Deployment
- DB migration applied remote: `0009_alignment.sql` ✅
- Worker deployed: version `731f534c-0087-42d5-81fb-c4c0eca7761d` ✅

## Notes
- This is the TW-15 foundation layer. Rob/Steal crime loop and Guild Navigator ship unlock catalog integration are planned next phases.
