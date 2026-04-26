# TW-05: PvP Infrastructure

## Work Identity
- **ID:** TW-05
- **Type:** Feature Update
- **Scope:** PvP Infrastructure — Loot, Respawn, Bounty, Notifications, Leaderboards, Protections

## Objective
Build the backend infrastructure that makes cutthroat PvP possible in TradeWars 3002 AI — without yet implementing the actual combat mechanics. The true TW2002 PvP experience is fighter-based sector control (TW-13). TW-05 is the foundation: loot calculation, respawn logic, bounty systems, kill tracking, news generation, notifications, and leaderboards.

> **Design Pivot:** After reviewing the Stardock Modern Manual, we determined that "ship-to-ship dueling" is not authentic TW2002 combat and would not be reused once fighters are introduced. Ship dueling has been removed from scope. See `ROADMAP.md` for details.

## In Scope
- **Loot System:** Calculate loot from destroyed ships (credits + cargo)
- **Respawn Logic:** FedSpace respawn, credit/cargo loss, hull/shield restore
- **Kill Tracking:** `pvp_kills` table, K/D stats, kill/death counters on player_ships
- **Bounty / Wanted System:** Track aggressive players, trigger NPC patrols (TW-03 integration)
- **News Generation:** PvP events in galaxy news ticker
- **Notifications:** Discord webhooks, in-game digest on login
- **Leaderboards:** Kills, deaths, net worth rankings
- **Protection Systems:** FedSpace safe zones, new player invulnerability, offline vulnerability rules

## Out of Scope
- **Ship-to-ship PvP combat endpoints** — removed. Not authentic TW2002, not reusable.
- **Fighter deployment & sector control** — TW-13
- **Sector blockades** — TW-13
- **Mines, photon torpedoes, Q-Cannons** — TW-06/TW-07
- **Player corporations / alliances** — TW-08+
- **Complex bounty hunting economy** — simple wanted count only
- **Diplomacy or trading between players**
- **Full alignment system** (good/evil paths, ISS unlocks) — placeholder bounty only; deferred

## Success Criteria
1. Loot formula is defined and testable (25% credits + 10% cargo for first pass; raises to 50% after TW-06)
2. Respawn logic places destroyed player in FedSpace with credit loss, cargo lost, hull/shield restored
3. PvP kills are tracked in `pvp_kills` table and reflected in player stats
4. Wanted/bounty system flags aggressive players and triggers NPC patrols
5. PvP events appear in galaxy news
6. New players (under 10k net worth or 24h old) are protected
7. FedSpace sectors are safe
8. Discord/in-game notifications work for PvP events
9. Leaderboards display top players by kills and net worth
10. All infrastructure is ready for TW-13 fighter-based combat to plug into

## Dependencies
- Blocked by: TW-04 (cloud infrastructure for shared player state)
- Blocks: TW-13 (fighter deployment needs kill tracking, loot, respawn, news, bounty)
- Related: TW-03 (NPC brain for bounty hunter NPCs)

## References
- PRD: `docs/TW3002-PRD.md` Section 5 (Multiplayer)
- TW-03 NPC brain for bounty/enforcer behavior
- **Stardock Modern Manual:** `../lore-reference/strategy/combat.md`
- **Stardock Modern Manual:** `../lore-reference/strategy/blockades.md`
- **Stardock Modern Manual:** `../lore-reference/core/fundamentals.md`
