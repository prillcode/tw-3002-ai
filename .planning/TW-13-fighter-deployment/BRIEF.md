# TW-13: Fighter Deployment & Sector Control

## Work Identity
- **ID:** TW-13
- **Type:** Major Feature
- **Scope:** Fighters, Sector Control, Blockades, True TW2002-Style PvP

## Objective
Implement the core PvP mechanic that made TradeWars 2002 legendary: **fighter-based sector control**. Players buy and deploy fighters in sectors to defend territory, block access to key locations (Stardock, FedSpace), and attack intruders. This is the first player-visible combat layer — strategic territorial warfare.

> **This is the true TW2002 PvP experience.** TW-05 built the infrastructure (loot, respawn, bounty, news, leaderboards). TW-13 is where players first experience competitive combat.

## In Scope
- **Fighter Purchase:** Buy fighters at StarDock or Class 0 ports
- **Fighter Deployment:** Drop fighters in sectors with three modes:
  - **Defensive** (1:1 odds) — challenge intruders; they can attack, retreat, or surrender
  - **Offensive** (2:1 odds) — auto-attack intruders with `1.25×` required force
  - **Tolled** — intruder pays 5 credits per fighter or fights at 1:1
- **Sector Entry Encounters:** When entering a sector with hostile fighters, resolve the encounter before normal sector actions
- **Offline Protection:** Deployed fighters auto-defend offline players (replaces TW-05's "offline = vulnerable" rule)
- **Blockades:** Coordinated fighter/mine deployment to deny access to Stardock or FedSpace
- **Fighter Accounting:** Track who owns what fighters; corp-shared fighter pools
- **Q-Cannon Damage:** Planetary atmospheric cannons fire on sector entry (if planet has citadel)
- **Limpet & Armid Mines:** Mine deployment and detonation on sector entry
- **Combat Sequence:** Ordered combat (empty ships → player ships by sign-on → sector fighters)
- **Loot Rebalance:** Raise player defeat loot from 25% to 50% credits (now that fighters provide defense)

## Out of Scope
- Planetary shields & citadel advancement (TW-07)
- Photon torpedoes (special weapon, future expansion)
- Cloaking device failure after 24h (Phase 5 covers basic cloaking)
- Full corporation mechanics (shared assets, corp banks) — TW-08 maybe
- Terra Hazz blockades (requires nav-hazard fields, not in current engine)

## Success Criteria
1. Player can buy fighters at StarDock
2. Player can deploy fighters in any non-FedSpace sector
3. Entering a sector with hostile fighters triggers an encounter
4. Defensive fighters challenge at 1:1 (attack/retreat/surrender)
5. Offensive fighters attack at 2:1 with 1.25× force
6. Offline players with deployed fighters are protected (auto-resolve)
7. Player defeat loot raised to 50% (fighters provide defense layer)
8. Blockade tactics are possible (Stardock denial via fig concentration)
9. Combat follows ordered sequence per TW2002 manual
10. Fighter ownership is tracked and visible in sector info

## Dependencies
- Blocked by: TW-05 (PvP infrastructure, shared player state, combat resolver)
- Blocked by: TW-03 (NPC brain for fighter encounters, patrol behavior)
- Blocks: TW-07 (planetary shields/citadels build on fighter systems)
- Related: `../lore-reference/strategy/combat.md`, `../lore-reference/strategy/blockades.md`

## References
- **Stardock Modern Manual — Combat:** `../lore-reference/strategy/combat.md`
  - Attack sequence, fighter accounting, combat odds table, Q-Cannon formulas
- **Stardock Modern Manual — Blockades:** `../lore-reference/strategy/blockades.md`
  - Scout blockade, photon blockade, fortress blockade, Terra Hazz blockade
- **Stardock Modern Manual — Fundamentals:** `../lore-reference/core/fundamentals.md`
  - Starting ship carries 30 fighters
