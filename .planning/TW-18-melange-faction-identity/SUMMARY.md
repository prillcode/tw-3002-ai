# TW-18 Summary — Melange & Faction Identity

**Status:** ✅ Completed (TransWarp fuel hook staged for future ship capability)

## Delivered

### 1) Melange as 4th Commodity
- Added melange to seeded port inventories for `caution` and `dangerous` sectors only.
- Added migration to backfill melange into existing live port inventories.
- Trade API now explicitly allows `melange` as a valid commodity.
- Market UI now shows melange as a distinct commodity (`⚡ Melange`) with amber styling.
- Ship cargo typing updated in web client to include optional melange.

### 2) NPC Factions + Name Pools
- Added `faction` to NPC persona type (`choam | fremen | sardaukar | guild | independent`).
- Reworked NPC generator with faction-specific name pools and behavior flavor:
  - Fremen (`⚔`) territorial raiders
  - Sardaukar (`💀`) aggressive raiders
  - CHOAM/Guild (`🛡`) patrol/trade authority
  - Independent (`📦`) free traders
- NPC tick behavior updated to reflect faction logic:
  - Sardaukar attack broadly
  - Fremen prioritize Sardaukar
  - CHOAM patrols target Sardaukar
- Added migration to backfill `faction` on existing NPC records (with small deterministic easter-egg name refresh for a subset of raiders).

### 3) Ship Renaming + Terminology Pass
- Ship display names updated:
  - `merchant` → **Spice Runner**
  - `scout` → **Dune Skiff**
  - `interceptor` → **Sardaukar Blade**
- Updated login ship picker names to match.
- UI terminology updates:
  - WANTED → **CHOAM Bounty Target**
  - Bounty tab → **CHOAM Bounty Board**
  - Galaxy News → **CHOAM Broadband**
  - Insurance UI → **Guild Protection Contract**
  - FedSpace strings in mine/fighter restrictions and surrender text → **CHOAM Protected Space**

### 4) Combat/News Flavor
- Combat narrative in `/api/action/combat` now includes faction-specific narrative variants.
- NPC combat news generation now includes faction prefixes in headlines.
- Sector and Combat views now display faction identity instead of generic NPC type.

## Migrations Applied (Remote)
- `0007_melange.sql` ✅
- `0008_npc_factions.sql` ✅

## Deploy
- Cloud Worker deployed: version `9d054abb-fadd-4704-b0dc-55dd760d2696`

## Notes
- TransWarp melange consumption remains intentionally staged until a live TransWarp-capable ship/route is active (TW-15+ ship progression). Melange trading is fully live now.
- TW-15 is now unblocked from faction-field perspective.
