# TW-08: Navigation, Help, and Leaderboard

## Work Identity
- **ID:** TW-08
- **Type:** Feature
- **Scope:** CLI — UI convenience features for cloud mode

## Objective
Add missing P2 features to the CLI cloud mode: Navigation Log, Help screen, and Leaderboard display.

## In Scope
- Wire `N` key in CloudSectorScreen to show NavigationScreen
- Wire `H` key in CloudSectorScreen to show HelpScreen
- Create Leaderboard screen (accessible from Welcome menu or sector key)
- Add `cloud` context to HelpScreen

## Out of Scope
- New game mechanics
- Server-side changes
- Web client

## Success Criteria
1. Pressing `N` in cloud mode shows visited sectors
2. Pressing `H` in cloud mode shows cloud-specific help
3. Leaderboard screen shows top 10 players by net worth
4. All screens work with keyboard navigation

## Dependencies
- Blocked by: TW-06 (cloud mode needs to exist)
- Blocks: None
- Related: TW-01 (CLI patterns)

## References
- `20260424_cloud-limitations.md` — items #7, #8, #9
