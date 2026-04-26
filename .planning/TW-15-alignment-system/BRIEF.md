# TW-15: Alignment System

## Work Identity
- **ID:** TW-15
- **Type:** Major Feature
- **Scope:** Alignment, Good vs Evil Paths, Ranks, Commission, ISS

## Objective
Implement the dual-path progression system that defines a player's identity. Good-aligned traders build, trade, and protect — earning CHOAM's trust and eventually a Guild Commission. Evil-aligned pirates rob, steal, and destroy — operating outside the law with the Fremen's grudging tolerance. The choice is economic, strategic, and consequential — it determines which ships you can fly, which factions hunt you, and how you survive the night.

> **Alignment is not just a number.** It's a playstyle declaration that gates content, unlocks ships, and determines your relationship with every faction in the galaxy.

> **Universe Bible:** See `../lore-reference/UNIVERSE-BIBLE.md` for faction definitions, terminology, and tone guidelines.

## In Scope
- **Alignment Tracking:** Range from -1000 (evil) to +1000 (good), starting at 0
- **Faction Standing:** Alignment determines relationship with CHOAM, Fremen, and Sardaukar factions
- **Good Path:** +alignment via bounty posting, tax payment, planet building, port upgrading, killing Sardaukar/evil NPCs
- **Evil Path:** -alignment via robbing ports, stealing cargo, destroying ports, killing good players
- **Rob & Steal:** Port crime mechanics unlocked at -100 alignment (bust chance ~1/50, penalties on failure)
- **Guild Commission:** Reach +1000 alignment → CHOAM grants Guild Commission → unlock Guild Navigator ship (ISS-equivalent)
- **Rank Progression:** 22 ranks from Private to Fleet Admiral, requiring exponential experience
- **Experience System:** XP from trading, combat, planet building, port upgrades
- **CHOAM Protected Space Access:** Good alignment grants overnight survival in safe sectors; evil alignment denies it
- **Port Behavior:** Evil ports offer Rob/Steal; good ports offer better trade terms
- **Faction NPC Behavior:** Sardaukar specifically target good-aligned players; Fremen toll non-evil players less aggressively
- **Fremen Neutrality:** Evil-aligned players are not tolled by Fremen-deployed fighters ("friends of the desert")

## Out of Scope
- Cross-pod alignment farming (requires two players coordinating — borderline collusion)
- Corp-level alignment management (no corps)
- Complex bounty hunting economy (simple wanted count only, from TW-05)
- Alignment decay over time (may add later)

## Success Criteria
1. Player alignment changes based on actions (positive for good deeds, negative for evil)
2. Rob and Steal options appear at ports when alignment ≤ -100
3. Rob/steal have bust chance (~1/50) with credit and experience penalties
4. Guild Commission unlocks at +1000 alignment, granting Guild Navigator (ISS) purchase rights
5. Rank progression tracks experience across 22 levels
6. Good-aligned players can survive overnight in CHOAM Protected Space (with limits)
7. Evil-aligned players are denied CHOAM protection and must cloak or hide
8. Sardaukar NPCs specifically target good-aligned players (increased encounter rate)
9. Fremen fighters do not toll evil-aligned players (Fremen neutrality)
10. Alignment displayed prominently in player profile and sector lists
11. Experience gain is tracked and visible

## Dependencies
- Blocked by: TW-05 (PvP infrastructure, kill tracking)
- Blocked by: TW-14 (planet building for alignment gain)
- Blocked by: TW-18 (faction identity must exist before alignment can reference factions)
- Blocks: Ship expansion (new ship classes need alignment gates)
- Related: `../lore-reference/alignment/good-path.md`, `../lore-reference/alignment/evil-path.md`, `../lore-reference/UNIVERSE-BIBLE.md`

## References
- **Universe Bible:** `../lore-reference/UNIVERSE-BIBLE.md`
  - Faction definitions (CHOAM, Fremen, Sardaukar), alignment-standing mappings, terminology
- **Stardock Modern Manual — Good Path:** `../lore-reference/alignment/good-path.md`
  - Alignment gain methods, commission process, ISS acquisition, FedSpace survival
- **Stardock Modern Manual — Evil Path:** `../lore-reference/alignment/evil-path.md`
  - Rob/steal mechanics, SSM/SST/SDT tactics, bust penalties
- **Stardock Modern Manual — Fundamentals:** `../lore-reference/core/fundamentals.md`
  - Rank table, experience requirements, alignment acquisition costs
