# TW-05: PvP Update

## Work Identity
- **ID:** TW-05
- **Type:** Feature Update
- **Scope:** Player-vs-Player Combat, Notifications, Protection Systems

## Objective
Add the cutthroat player-vs-player combat that made Trade Wars 2002 legendary. Players can attack each other, steal cargo/credits, and hold grudges — but with guardrails to prevent griefing and protect newcomers.

## In Scope
- **PvP Combat:** Attack other players in the same sector
- **Loot System:** Steal cargo and credits from destroyed ships
- **Offline Vulnerability:** Players can be attacked while offline (with protections)
- **FedSpace Safe Zones:** No PvP in designated sectors
- **New Player Protection:** Level/credit thresholds prevent farming beginners
- **Bounty System:** Attacking innocents makes you wanted (NPC patrols hunt you)
- **Kill Feed / News:** PvP events appear in galaxy news ticker
- **Discord Notifications:** Webhook alerts for attacks, deaths, bounties
- **Revenge Tracking:** See who destroyed you, plot retaliation

## Out of Scope
- Player corporations / alliances (too complex)
- Mines or planetary defenses (TW-06 maybe)
- Photon torpedoes or special weapons (future expansion)
- Complex bounty hunting economy
- Diplomacy or trading between players

## Success Criteria
1. Player can attack another player in the same sector
2. Combat uses same engine resolver as NPC combat (fair, deterministic)
3. Destroyed player respawns at FedSpace with 90% credits, cargo lost
4. Attacker loots 50% of credits + some cargo
5. PvP events appear in galaxy news
6. New players (under 10k net worth or 24h old) cannot be attacked
7. FedSpace sectors are safe — no PvP possible
8. Discord webhook optional — player opts in via config
9. Bounty system: 3+ unprovoked kills = NPC patrols hunt you
10. Victim gets notification (Discord or email) of who attacked them

## Dependencies
- Blocked by: TW-04 (needs cloud infrastructure for shared player state)
- Blocks: None
- Related: TW-03 (NPC brain for bounty hunter NPCs)

## References
- PRD: `docs/TW3002-PRD.md` Section 5 (Multiplayer)
- TW-03 NPC brain for bounty/enforcer behavior
