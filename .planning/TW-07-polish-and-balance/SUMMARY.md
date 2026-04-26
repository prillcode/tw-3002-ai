# TW-07: Polish and Balance — Summary

## Status: ✅ Complete

**Date:** 2026-04-24 (completed during earlier sessions)

---

## Overview

Fixed three P1 gameplay feel issues in cloud mode: shared port inventories, distinct ship classes, and combat storytelling. All done impromptu without formal planning docs.

---

## Phase 1: Port Inventory Refresh ✅

**Problem:** Port supply wasn't shared — Player A buying ore didn't reduce supply for Player B.

**Solution:**
- `cloudGetSector()` fetches fresh sector data (including `port_inventory_json`) on every sector entry
- Trade overlay reads from refreshed inventory
- `POST /api/action/trade` deducts supply from D1, so subsequent fetches show reduced amounts

**Files:** `cli/src/screens/CloudSectorScreen.tsx`, `cloud/src/routes/action.ts`

---

## Phase 2: Ship Stats from Class + Upgrades ✅

**Problem:** All ships felt identical — hardcoded `maxCargo: 120`, `maxHull: s.hull`.

**Solution:**
- Created `web/game/src/data/ships.ts` with `SHIP_CLASSES` defining base stats per class
- `computeEffectiveStats(classId, upgrades)` calculates effective maxima from class + upgrades
- Merchant (120 cargo), Scout (120 turns), Interceptor (120 hull) now feel distinct
- Upgrades apply immediately via `upgrades_json` from API

**Files:** `web/game/src/data/ships.ts`, `web/game/src/data/upgrades.ts`

---

## Phase 3: Combat Narrative ✅

**Problem:** Combat returned raw numbers — no storytelling.

**Solution:**
- `generateCombatNarrative()` in `cloud/src/routes/action.ts` creates short narrative strings
- Narrative varies by action (attack/flee/bribe), outcome (won/lost), and enemy type
- Response includes `narrative` field displayed in CLI and web client combat screens

**Files:** `cloud/src/routes/action.ts`

---

## Notes

- All three phases were executed impromptu alongside TW-06 cloud gameplay limitations
- CLI CloudSectorScreen and web client both consume the same API responses
- Ship stats system was later extended in TW-05 to include PvP stats (K/D, wanted, insurance)
