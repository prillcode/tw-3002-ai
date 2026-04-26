# 14-02 Plan — Citadel Advancement, Q-Cannons, Resource Transport

## Objective
Planets have upgradeable citadels with class-specific costs, configurable Q-cannons, and resource transport between ship and planet.

## Status: ✅ Completed

## What Shipped

### Citadel Advancement
- `POST /api/planets/citadel/advance` — upgrade citadel L0→L6, deducts planet resources
- `GET /api/planets/citadel-costs` — preview next level requirements with affordability check
- Full cost tables for all 7 planet classes (canonical TW2002 values)
- Citadel levels: None → Bunker → Barracks → Fortress → Citadel → Stronghold → Interdictor

### Q-Cannons
- `POST /api/planets/qcannon` — configure sector/atmo cannon % (requires L3+/L4+)
- `computeQCannonDamage()` — exported for TW-13 entry pipeline integration
- Sector formula: `(TotalOre * SectPct) / 3`
- Atmo formula: `TotalOre * AtmoPct * 2`

### Resource Transport
- `POST /api/planets/transport` — deposit/withdraw FOE between ship cargo and planet
- Validates ownership and resource availability

### Web Client (PlanetModal.vue)
- Tabbed UI: Colonize, Citadel, Q-Cannon, Transport
- Citadel upgrade with resource requirements and color-coded affordability
- Q-Cannon sliders (0-100%) with level-gating
- Resource transport deposit/withdraw with fuel/org/eq inputs

## Citadel Level Progression
| Level | Name | Unlocks |
|-------|------|---------|
| 0 | None | Nothing |
| 1 | Bunker | Fighter deployment from planet |
| 2 | Barracks | Expanded fighter garrison |
| 3 | Fortress | Sector Q-Cannon |
| 4 | Citadel | Atmo Q-Cannon, planetary trading |
| 5 | Stronghold | Enhanced defenses |
| 6 | Interdictor | Maximum fortification, interdiction |

## Files Changed
- `cloud/src/routes/planets.ts` (major additions)
- `cloud/src/index.ts` (4 new routes)
- `web/game/src/components/PlanetModal.vue` (full rewrite with tabs)
