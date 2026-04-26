# TW-14 Summary: Planets & Citadels

**Status:** ✅ Phases 1-4 Complete | Phase 5 (Planetary Trading) Remaining

## What Was Built
A complete planet system from creation through citadel fortification, based on canonical TW2002 planetary mechanics.

### Phase 1: Planet Creation & Colonization ✅
- Genesis Torpedo creation (80k cr, non-safe sectors only)
- 7 planet classes with weighted randomization and U-class crowding
- Colonist transport with fuel/credit costs
- Daily production tick wired into cron

### Phase 2: Production & Daily Tick ✅
- Bell curve production (max at 50% colonist capacity)
- FOE output per class with production caps
- Fighter generation from colonists (class-specific divisor)
- Produced fighters auto-deploy to owner's ship

### Phase 3: Citadel Advancement ✅
- 6 upgrade levels with class-specific resource costs (canonical TW2002)
- Bunker → Barracks → Fortress → Citadel → Stronghold → Interdictor
- Cost preview with affordability check API

### Phase 4: Q-Cannons & Defense ✅
- Sector cannon: `(TotalOre * SectPct) / 3` (requires L3+)
- Atmospheric cannon: `TotalOre * AtmoPct * 2` (requires L4+)
- Configurable 0-100% settings per cannon type
- `computeQCannonDamage()` exported for TW-13 entry pipeline

### Resource Transport ✅
- Deposit/withdraw FOE between ship cargo and planet storage
- Ownership validation, resource availability checks

## API Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/planets/create | Genesis Torpedo |
| GET | /api/planets/sector | List sector planets |
| GET | /api/planets/:id | Planet details + production |
| POST | /api/planets/colonize | Transport colonists |
| GET | /api/planets/citadel-costs | Preview upgrade costs |
| POST | /api/planets/citadel/advance | Upgrade citadel |
| POST | /api/planets/qcannon | Configure cannons |
| POST | /api/planets/transport | Ship ↔ planet resources |

## Remaining (Phase 5)
- Planetary trading (sell planet FOE to adjacent ports)
- Planet transport (move planet to adjacent sector)
- These are lower priority — planets are functional strategic assets without them

## Key Design Decisions
- **No shared planets** — single owner per planet
- **Production on cron** — planets grow even when player is offline
- **Q-cannon as separate config** — not auto-tied to citadel level, player chooses %
- **Canonical costs** — all citadel upgrade costs match TW2002 reference docs exactly
- **Fighters to ship** — produced fighters auto-deposit to owner's ship, not planet inventory

## Unblocks
- TW-13 Q-cannon live damage integration (uses `computeQCannonDamage`)
- TW-15 Alignment System (planet building gives alignment points)
