# TW-07: Polish and Balance

## Work Identity
- **ID:** TW-07
- **Type:** Enhancement
- **Scope:** Cloud API + CLI — gameplay polish and balance fixes

## Objective
Fix P1 limitations that improve game feel and fairness: port inventory sharing, ship stat computation, and combat narrative.

## In Scope
- Port inventory refresh on every sector load (shared economy)
- Compute ship effective stats from class + upgrades in cloud mode
- Add combat narrative strings to cloud combat results
- Re-balance flee chance, bribe costs, upgrade pricing if needed

## Out of Scope
- New features (no new screens, no new game modes)
- Economy overhaul
- PvP combat

## Success Criteria
1. Player B sees reduced ore supply after Player A buys it
2. Merchant, Scout, and Interceptor classes feel distinct in cloud mode
3. Combat results include a short narrative description
4. No hardcoded stats in CloudSectorScreen

## Dependencies
- Blocked by: TW-06 Phase 2 (StarDocks needed for upgrade balance testing)
- Blocks: TW-08
- Related: TW-02 (engine balance)

## References
- `20260424_cloud-limitations.md` — items #2, #5, #10
