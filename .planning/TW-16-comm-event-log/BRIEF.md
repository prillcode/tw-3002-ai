# TW-16: Comm & Event Log

## Work Identity
- **ID:** TW-16
- **Type:** Feature
- **Scope:** Web Client — categorized, timestamped event log replacing ephemeral message banner

## Objective
Replace the single dismissable message banner in SectorView with a persistent, categorized event log. Every game action (warp, trade, combat, upgrade, news) generates a tagged, timestamped entry. Players can review their session history at any time instead of losing context when they dismiss a message.

## Context
Currently `ship.message` is a single string ref. Every new action overwrites the previous message. If a player warps after combat, the combat result is gone. The NavigationView only tracks sector visits — not trades, combat, upgrades, or news. A categorized comm log is the single highest-ROI UX improvement available: it makes the game *readable*.

## In Scope
- Pinia store (`eventLog`) with typed, categorized entries
- Event types: NAV, TRD, CMB, UPG, EVT, SYS
- Timestamp per entry (local, not server)
- SectorView sidebar/drawer showing last ~20 entries
- Replace `ship.message` banner with log-driven display
- NavigationView absorbs log entries (becomes "Activity Log")
- Auto-scroll to latest, with scrollback

## Out of Scope
- Server-side event persistence (entries are session-only, lost on refresh)
- Comm log in CLI (CLI already has screen-by-screen flow)
- Filtering/searching entries
- Exporting log

## Success Criteria
1. Every game action generates a tagged log entry
2. Warping after combat no longer erases combat results
3. Player can open log panel and see last 20+ events in order
4. Each entry shows icon + tag + timestamp + description
5. `ship.message` ref removed entirely

## Dependencies
- Blocked by: None
- Blocks: None
- Related: TW-10 (web client), TW-13 (fighter actions will add CMB entries)

## References
- `.planning/IDEAS.md` — "Comm Log (Message System Overhaul)" section
- `web/game/src/stores/ship.ts` — current `message` ref to replace
- `web/game/src/views/SectorView.vue` — current message banner (line ~291)
- `web/game/src/views/NavigationView.vue` — current sector-visit-only log
