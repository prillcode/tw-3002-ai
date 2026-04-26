# TW-15: Alignment System

## Work Identity
- **ID:** TW-15
- **Type:** Major Feature
- **Scope:** Alignment, Good vs Evil Paths, Ranks, Commission, ISS

## Objective
Implement the dual-path progression system that defines a player's identity in TW2002. Good-aligned traders build, trade, and protect. Evil-aligned pirates rob, steal, and destroy. The choice is economic, strategic, and irreversible — it determines which ships you can fly, which ports will serve you, and how you survive the night.

> **Alignment is not just a number.** It's a playstyle declaration that gates content, unlocks ships, and determines your relationship with the entire galaxy.

## In Scope
- **Alignment Tracking:** Range from -1000 (evil) to +1000 (good), starting at 0
- **Good Path:** +alignment via bounty posting, tax payment, planet building, port upgrading, killing evil players/aliens
- **Evil Path:** -alignment via robbing ports, stealing cargo, destroying ports, killing good players
- **Rob & Steal:** Port crime mechanics unlocked at -100 alignment (bust chance ~1/50, penalties on failure)
- **Commission & ISS:** Reach +1000 alignment → commission → unlock Imperial StarShip purchase
- **Rank Progression:** 22 ranks from Private to Fleet Admiral, requiring exponential experience
- **Experience System:** XP from trading, combat, planet building, port upgrades
- **FedSpace Access:** Good alignment grants overnight FedSpace survival; evil alignment denies it
- **Port Behavior:** Evil ports offer Rob/Steal; good ports offer better trade terms

## Out of Scope
- Cross-pod alignment farming (requires two players coordinating — borderline collusion)
- Corp-level alignment management (no corps)
- Complex bounty hunting economy (simple wanted count only, from TW-05)
- Alignment decay over time (may add later)

## Success Criteria
1. Player alignment changes based on actions (positive for good deeds, negative for evil)
2. Rob and Steal options appear at ports when alignment ≤ -100
3. Rob/steal have bust chance (~1/50) with credit and experience penalties
4. Commission unlocks at +1000 alignment, granting ISS purchase rights
5. Rank progression tracks experience across 22 levels
6. Good-aligned players can survive overnight in FedSpace (with limits)
7. Evil-aligned players are denied FedSpace protection and must cloak or hide
8. Alignment displayed prominently in player profile and sector lists
9. Experience gain is tracked and visible

## Dependencies
- Blocked by: TW-05 (PvP infrastructure, kill tracking)
- Blocked by: TW-14 (planet building for alignment gain)
- Blocks: TW-16 (ship expansion needs alignment gates)
- Related: `../lore-reference/alignment/good-path.md`, `../lore-reference/alignment/evil-path.md`

## References
- **Stardock Modern Manual — Good Path:** `../lore-reference/alignment/good-path.md`
  - Alignment gain methods, commission process, ISS acquisition, FedSpace survival
- **Stardock Modern Manual — Evil Path:** `../lore-reference/alignment/evil-path.md`
  - Rob/steal mechanics, SSM/SST/SDT tactics, bust penalties
- **Stardock Modern Manual — Fundamentals:** `../lore-reference/core/fundamentals.md`
  - Rank table, experience requirements, alignment acquisition costs
