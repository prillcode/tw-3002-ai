# 14-01 Plan — Planet Creation & Colonization

## Objective
Players can create planets using Genesis Torpedoes and populate them with colonists.

## Status: ✅ Completed

## What Shipped
- `POST /api/planets/create` — Genesis Torpedo (80k cr), weighted class randomization with U-class crowding
- `GET /api/planets/sector` — list planets in a sector with owner info
- `GET /api/planets/:id` — full planet details with daily production rates
- `POST /api/planets/colonize` — transport colonists (fuel + credit cost, capped by class)
- `handleProductionTick()` — daily FOE + fighter production, wired into cron
- Migration `0006_planets.sql` with `planets` table + `planet_count` on sectors
- PlanetModal.vue with planet details, daily production, colonize UI
- SectorView.vue: planet list, Genesis Torpedo button [G], planet click-to-view
- StarDockView.vue: Genesis Torpedo info section

## Planet Classes (canonical TW2002)
| Class | Name | Max Col | Best For |
|-------|------|---------|----------|
| M | Earth Type | 30,000 | Balanced |
| K | Desert | 40,000 | Fuel |
| O | Oceanic | 200,000 | Organics |
| L | Mountainous | 40,000 | Fighters |
| C | Glacial | 100,000 | Penal/mixed |
| H | Volcanic | 100,000 | Fuel (extreme) |
| U | Gas | 3,000 | No production |

## Files Changed
- `cloud/migrations/0006_planets.sql`
- `cloud/src/routes/planets.ts` (new)
- `cloud/src/index.ts` (routes + cron)
- `web/game/src/components/PlanetModal.vue` (new)
- `web/game/src/views/SectorView.vue`
- `web/game/src/views/StarDockView.vue`
