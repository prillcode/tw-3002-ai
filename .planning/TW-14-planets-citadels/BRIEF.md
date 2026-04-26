# TW-14: Planets & Citadels

## Work Identity
- **ID:** TW-14
- **Type:** Major Feature
- **Scope:** Planet Creation, Colonization, Production, Citadel Advancement

## Objective
Implement the planetary system that powers TW2002's endgame economy. Players create planets using Genesis Torpedoes, populate them with colonists, and advance citadel levels to unlock fighter production, Q-cannons, and planetary trading. Without planets, fighters are just purchased commodities — with planets, they become a renewable resource that fuels sector control.

> **Planets are the economic engine.** Fighter deployment (TW-13) is the combat layer. Planets are what make that combat layer sustainable.

## In Scope
- **Planet Creation:** Launch Genesis Torpedoes in sectors to create planets
- **7 Planet Classes:** M (Earth), K (Desert), O (Oceanic), L (Mountain), C (Glacial), H (Volcanic), U (Gas)
- **Colonization:** Transport colonists from FedSpace, population growth/die-off mechanics
- **Daily Production:** FOE (Fuel, Organics, Equipment) production per class, bell curve at 50% capacity
- **Fighter Production:** Planets generate fighters daily from FOE output
- **Citadel Advancement:** Levels 0-6 with resource costs and defensive upgrades
- **Q-Cannons:** Planetary cannons that fire on sector entry (sector + atmospheric modes)
- **Planetary Trading:** Move planet to port, trade cargo, return
- **Planet Transport:** Relocate planets between sectors

## Out of Scope
- Mobile planets (Level 6 citadel mobility — future expansion)
- Planet terraforming or class conversion
- Planetary shields independent of citadel level
- Corporation-shared planets (no corps per project direction)
- Alien/Ferrengi planet interaction

## Success Criteria
1. Player can buy and launch a Genesis Torpedo to create a planet
2. Planet class is randomized with weighted probabilities (U-class increases with sector crowding)
3. Player can transport colonists to a planet
4. Planet produces FOE daily based on class, colonist count, and 50% bell curve
5. Planet produces fighters daily from FOE output
6. Player can advance citadel levels 1-6 with resource costs
7. Q-cannons fire on sector entry with correct damage formulas
8. Planetary trading allows moving planet to port and exchanging cargo
9. Planet info visible in sector details and dedicated planet management UI
10. Planet ownership is individual only (no shared/corp ownership)

## Dependencies
- Blocked by: TW-13 Phase 1 (fighter system needs to exist for fighter production to matter)
- Blocked by: TW-05 (loot/respawn infrastructure)
- Blocks: TW-13 Phase 5 (Q-cannons require planets with citadels)
- Blocks: TW-15 (alignment gain from planet building)
- Related: `../lore-reference/core/planets.md`, `../lore-reference/core/fundamentals.md`

## References
- **Stardock Modern Manual — Planets:** `../lore-reference/core/planets.md`
  - Class descriptions, production tables, citadel advancement costs, fighter formulas
- **Stardock Modern Manual — Fundamentals:** `../lore-reference/core/fundamentals.md`
  - Colonist mechanics, optimal population, production bell curve
