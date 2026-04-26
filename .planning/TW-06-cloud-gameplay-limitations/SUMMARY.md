# TW-06: Cloud Gameplay Limitations — Summary

## Status: ✅ Complete

**Date:** 2026-04-24 (completed during earlier sessions)
**Type:** Bug Fix / Feature Gap Closure

---

## Overview

This work item closed three critical P0 gaps that prevented cloud mode from feeling like a complete game: invisible trade prices, missing StarDocks, and frozen NPCs. All three issues were fixed without formal PLAN/SUMMARY documentation at the time — this document retroactively captures the completed work.

---

## Phase 1: Trade Prices in Cloud Mode ✅

**Problem:** Players trading in cloud mode saw quantities but no prices — they were trading blind.

**Solution:**
- `CloudSectorScreen` now parses `port_inventory_json` from the API response
- Trade overlay displays live buy/sell prices for all 3 commodities
- Profit indicator shows if player cargo is worth more/less than base price
- Prices refresh on every sector load

**Files changed:**
- `cli/src/screens/CloudSectorScreen.tsx` — trade overlay parsing

---

## Phase 2: StarDocks in Cloud Mode ✅

**Problem:** No way to upgrade ships in cloud mode. `sectors` table had no stardock flag.

**Solution:**
- D1 migration `0002_stardocks.sql`: `ALTER TABLE sectors ADD COLUMN stardock INTEGER DEFAULT 0`
- Seeded 4 StarDock sectors: 13, 250, 500, 750
- Built `POST /api/action/upgrade` endpoint (validates credits, prerequisites, applies stats)
- `CloudSectorScreen` wires `D` key to open upgrade menu at stardock sectors
- Upgrade catalog (`UPGRADE_CATALOG`) available client-side via engine package

**Files changed:**
- `cloud/migrations/0002_stardocks.sql`
- `cloud/src/routes/action.ts` — `handleUpgrade()`
- `cloud/src/upgrades.ts` — self-contained upgrade catalog for Worker
- `cloud/scripts/seed.ts` — stardock sector marking
- `cli/src/screens/CloudSectorScreen.tsx` — upgrade UI

---

## Phase 3: NPC Tick Endpoint ✅

**Problem:** NPCs were seeded once and never moved. The galaxy felt static.

**Solution:**
- Built `POST /api/npc/tick` endpoint (admin-gated via `ADMIN_SECRET`)
- Implemented rule-based NPC decision loop:
  - **Traders** move toward ports, buy low/sell high
  - **Raiders** move toward dangerous sectors, attack players/NPCs
  - **Patrols** move toward FedSpace, attack raiders
- Cron Trigger in `wrangler.toml` fires every 5 minutes
- NPCs update `current_sector`, `credits`, `cargo_json`, `memory_json`
- News items generated for kills, trades, captures
- Returns tick summary: `{ npcsProcessed, actionsTaken, newsGenerated }`

**Files changed:**
- `cloud/src/routes/npc.ts` — `handleNPCTick()`, `runNPCTick()`
- `cloud/src/index.ts` — Cron Trigger wiring
- `cloud/wrangler.toml` — `[[triggers]]` cron schedule
- `cli/src/screens/CloudSectorScreen.tsx` — fresh NPCs on sector entry

---

## Verification

- [x] Trade overlay shows prices matching D1 `port_inventory_json`
- [x] StarDock sectors return `stardock: 1` from API
- [x] Upgrades deduct credits and persist across sessions
- [x] NPC positions change after tick endpoint runs
- [x] News table has entries after NPC ticks
- [x] Cron Trigger fires every 5 minutes (Wrangler logs confirm)

---

## Notes

- All three phases were executed impromptu during a single session without formal planning docs
- This work unblocked TW-07 (polish) and TW-08 (UI features) by making cloud mode fully playable
- NPC tick system is rule-based only — no LLM involvement for reliability and cost control
