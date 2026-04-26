# TW-05: PvP Update

## Work Identity
- **ID:** TW-05
- **Type:** Feature Update
- **Scope:** Player-vs-Player Combat, Notifications, Protection Systems

## Objective
Add the cutthroat player-vs-player combat that made Trade Wars 2002 legendary. Players can attack each other, steal cargo/credits, and hold grudges — but with guardrails to prevent griefing and protect newcomers.

> **Scope Note:** Phase 1 implements a simplified **ship-to-ship duel** model to prove API mechanics and client integration. True TW2002 PvP is **fighter-based sector control** (defensive figs, offensive figs, blockades, Q-Cannons) — this is the domain of TW-06.

## In Scope
- **PvP Combat:** Attack other players in the same sector (ship-to-ship duel)
- **Loot System:** Steal cargo and credits from destroyed ships
- **Offline Vulnerability:** Players can be attacked while offline (with protections)
- **FedSpace Safe Zones:** No PvP in designated sectors
- **New Player Protection:** Level/credit thresholds prevent farming beginners
- **Bounty System:** Attacking innocents makes you wanted (NPC patrols hunt you)
- **Kill Feed / News:** PvP events appear in galaxy news ticker
- **Discord Notifications:** Webhook alerts for attacks, deaths, bounties
- **Revenge Tracking:** See who destroyed you, plot retaliation

## Out of Scope
- **Fighter deployment & sector control** — deferred to TW-06 (see `../TW-06-fighter-deployment/`)
- **Sector blockades** — requires fighter deployment + mine systems
- **Player corporations / alliances** — too complex for first pass
- **Mines or planetary defenses** (TW-07 maybe)
- **Photon torpedoes or special weapons** (future expansion)
- **Complex bounty hunting economy** — simple wanted count only
- **Diplomacy or trading between players**
- **Alignment system** (good/evil paths, ISS unlocks) — placeholder bounty only; full alignment deferred

## Success Criteria
1. Player can attack another player in the same sector
2. Combat uses same engine resolver as NPC combat (fair, deterministic)
3. Destroyed player respawns at FedSpace with 90% credits, cargo lost
4. Attacker loots **25%** of credits + some cargo (conservative for first pass; increase after insurance/TW-06)
5. PvP events appear in galaxy news
6. New players (under 10k net worth or 24h old) cannot be attacked
7. FedSpace sectors are safe — no PvP possible
8. Discord webhook optional — player opts in via config
9. Bounty system: 3+ unprovoked kills in 24h = NPC patrols hunt you (placeholder for full alignment)
10. Victim gets notification (Discord or in-game digest) of who attacked them

## Dependencies
- Blocked by: TW-04 (needs cloud infrastructure for shared player state)
- Blocks: TW-06 (fighter deployment builds on PvP infra)
- Related: TW-03 (NPC brain for bounty hunter NPCs)

## References
- PRD: `docs/TW3002-PRD.md` Section 5 (Multiplayer)
- TW-03 NPC brain for bounty/enforcer behavior
- **Stardock Modern Manual:** `../lore-reference/strategy/combat.md` — TW2002 combat sequence, fighter accounting, Q-Cannon formulas
- **Stardock Modern Manual:** `../lore-reference/strategy/blockades.md` — sector control tactics, fighter deployment strategy
- **Stardock Modern Manual:** `../lore-reference/core/fundamentals.md` — alignment, ranks, commission mechanics
