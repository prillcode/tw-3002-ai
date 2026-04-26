# TW-18: Melange & Faction Identity

## Work Identity
- **ID:** TW-18
- **Type:** Feature (Content + Mechanics)
- **Scope:** 4th commodity, NPC factions, ship renaming, UI terminology

## Objective
Give TW 3002 AI a distinct creative identity by introducing the Dune-inspired universe defined in `../lore-reference/UNIVERSE-BIBLE.md`. This work item has two parts: (1) add **melange** as a 4th trade commodity with a mechanical role as TransWarp fuel, and (2) apply faction identity across NPCs, ships, and UI text. Together these transform the game from "generic space trading" into a universe with its own mythology.

> **This is the identity layer.** Every work item after TW-18 should reference the Universe Bible for faction names, terminology, and tone.

## In Scope
- **Melange as 4th commodity:** Schema, port generation, trade API, market UI, pricing
- **Melange as TransWarp fuel:** Consumed when TransWarping (1 unit per jump)
- **NPC faction field:** Add `faction` to NPC personas with 5 factions (CHOAM, Fremen, Sardaukar, Guild, Independent)
- **Faction-specific NPC name pools:** Fremen names, Sardaukar names, Guild names, Free Trader names
- **Ship class renaming:** Merchant → Spice Runner, Scout → Dune Skiff, Interceptor → Sardaukar Blade
- **UI terminology pass:** FedSpace → CHOAM Protected Space, ISS → Guild Navigator, commission → Guild Commission, insurance → Guild Protection Contract, wanted → CHOAM Bounty
- **Combat narrative faction variants:** Sardaukar encounter text differs from Fremen encounter text
- **News headline faction flavor:** "Sardaukar raider eliminated" vs "Fremen warrior destroyed"
- **SectorView NPC icons:** Fremen (⚔), Sardaukar (💀), Guild Sentinel (🛡), Free Trader (📦)

## Out of Scope
- Alignment-based NPC behavior (TW-15)
- New ships or ship classes
- New game mechanics beyond melange trading/consumption
- Melange production on planets (TW-14 Phase 2+)
- Guild Navigator encounters (rare mystical NPCs — future expansion)
- Deep lore / narrative events / quests

## Success Criteria
1. Melange appears as a 4th commodity at ports with extremely high value
2. Ports in certain sectors carry melange supply (rarer than ore/organics/equipment)
3. MarketView shows melange alongside existing commodities
4. NPC personas include a `faction` field with faction-appropriate names and behavior
5. SectorView shows NPC faction identity (icons, colors, names)
6. Ship classes renamed with Dune-inspired names
7. UI text uses CHOAM/Guild terminology instead of Federation terminology
8. Combat narrative varies by enemy faction
9. News headlines reference factions by name

## Dependencies
- Blocked by: None (can start immediately)
- Blocks: TW-15 (alignment needs faction field on NPCs and faction-aware terminology)
- Related: `../lore-reference/UNIVERSE-BIBLE.md`

## References
- **Universe Bible:** `../lore-reference/UNIVERSE-BIBLE.md`
  - Faction definitions, melange properties, ship names, terminology guide, tone guidelines
- **Stardock Modern Manual — Trading:** `../lore-reference/core/trading.md`
  - Port mechanics, supply/demand
- **Current commodity system:** `cloud/src/routes/action.ts` (trade endpoint)
  - `web/game/src/views/MarketView.vue` (trade UI)
  - `packages/engine/src/economy/pricing.ts` (price calculations)
