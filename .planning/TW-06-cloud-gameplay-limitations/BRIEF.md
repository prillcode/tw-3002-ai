# TW-06: Cloud Gameplay Limitations

## Work Identity
- **ID:** TW-06
- **Type:** Feature
- **Scope:** Cloud API + CLI — core gameplay gaps in cloud mode

## Objective
Fix the three P0 limitations that prevent cloud mode from feeling like a complete game: invisible trade prices, missing StarDocks, and frozen NPCs.

## In Scope
- Parse `port_inventory_json` into the CLI trade overlay
- Add StarDock sectors to the cloud galaxy schema and seed script
- Build `POST /api/action/upgrade` endpoint for cloud upgrades
- Implement rule-based NPC tick endpoint (or Cron Trigger) for cloud galaxy evolution
- Update seed script to mark stardock sectors
- D1 schema migration for `stardock` flag

## Out of Scope
- LLM-driven NPC ticks (TW-03 territory — rule-based only)
- New ship classes or upgrade types
- Economy rebalancing (prices are fine)
- Web client UI

## Success Criteria
1. Player sees current buy/sell prices when trading in cloud mode
2. Player can buy upgrades at StarDocks in cloud mode
3. NPCs move, trade, and fight every 5 minutes in the cloud
4. News ticker reflects actual NPC activity
5. All changes work in both CLI cloud mode and via `curl`

## Dependencies
- Blocked by: None
- Blocks: TW-07 (polish), TW-08 (UI features)
- Related: TW-04 (cloud infra), TW-03 (NPC brain)

## References
- `20260424_cloud-limitations.md` — source analysis
- `cloud/AGENTS.md` — cloud architecture rules
- `cli/AGENTS.md` — CLI patterns
