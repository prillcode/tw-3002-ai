# TW-06 Roadmap: Cloud Gameplay Limitations

**Estimated Total:** 10–14 hours (2–3 focused sessions)

## Phase 1: Trade Prices in Cloud Mode (1–2 hours)
**Goal:** Players see prices when trading in cloud mode.

**Deliverables:**
- [ ] Parse `port_inventory_json` in `CloudSectorScreen` trade overlay
- [ ] Display buy/sell price per commodity
- [ ] Show profit margin if player owns the commodity
- [ ] Verify with `curl` that prices match D1 data

**Success:** Trading is no longer blind.

---

## Phase 2: StarDocks in Cloud Mode (3–4 hours)
**Goal:** Players can upgrade ships in cloud mode.

**Deliverables:**
- [ ] D1 migration: `ALTER TABLE sectors ADD COLUMN stardock INTEGER DEFAULT 0`
- [ ] Update `scripts/seed.ts` to mark 3–5 sectors as stardocks
- [ ] Update `buildGalaxyFromCloud()` to read `stardock` flag
- [ ] `POST /api/action/upgrade` endpoint (validate credits, apply upgrade, update ship)
- [ ] Wire StarDock flow into `CloudSectorScreen`
- [ ] Re-seed cloud galaxy with stardocks

**Success:** Cloud players can buy hull, shield, cargo, and weapon upgrades.

---

## Phase 3: NPC Tick Endpoint (6–8 hours)
**Goal:** NPCs evolve in the cloud galaxy.

**Deliverables:**
- [ ] `POST /api/npc/tick` endpoint (or Cron Trigger every 5 min)
- [ ] Rule-based NPC decision logic in Worker:
  - Traders: move toward ports, buy low, sell high
  - Raiders: move toward dangerous sectors, attack other NPCs
  - Patrols: move toward FedSpace, attack raiders
- [ ] Update `npcs` table: position, credits, cargo, memory
- [ ] Insert news items for kills, trades, captures
- [ ] Return tick summary `{ npcsProcessed, actionsTaken, newsGenerated }`
- [ ] Update `CloudSectorScreen` to show fresh NPCs on sector entry

**Success:** The galaxy feels alive. News ticker updates with real events.

---

## Phase Completion Order
1 → 2 → 3

Phase 1 is quick. Phase 2 is schema + API. Phase 3 is the big behavioral system.

---

## Definition of Done
- Trade prices visible in cloud mode
- StarDocks present and functional in cloud mode
- NPCs move and act every 5 minutes
- News reflects real NPC activity
- All endpoints tested with `curl`
