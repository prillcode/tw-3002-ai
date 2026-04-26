# TW-06 Roadmap: Fighter Deployment & Sector Control

**Estimated Total:** 32-40 hours (4-5 focused sessions)

> **This is the leap from ship dueling to true TW2002 warfare.** Every phase adds a new defensive/offensive layer.

## Phase 1: Fighter Purchase & Deployment (6-8 hours)
**Goal:** Players can buy and drop fighters in sectors

**Deliverables:**
- [ ] `POST /fighters/buy` — purchase fighters at StarDock (price: ~100 cr/fighter, tunable)
- [ ] `POST /fighters/deploy` — deploy fighters in current sector with mode (defensive/offensive/tolled)
- [ ] `GET /fighters/sector` — list fighters in a sector with owner and mode
- [ ] D1 schema: `sector_fighters` table (sector_id, galaxy_id, owner_id, count, mode, deployed_at)
- [ ] Web client: StarDock UI for buying fighters; sector UI for deployment
- [ ] Starting ship bonus: give new players 30 fighters (matching TW2002)

**Success:** Players can buy figs and drop them in sectors.

---

## Phase 2: Sector Entry Encounters (8-10 hours)
**Goal:** Entering a sector with hostile fighters triggers combat

**Deliverables:**
- [ ] Sector entry hook: before loading sector content, check for hostile fighters
- [ ] Defensive fighter encounter (1:1 odds):
  - Intruder options: Attack, Retreat, Surrender
  - Retreat: return to previous sector (consume 1 turn)
  - Surrender: ejected to nearest FedSpace (or lose 10% credits as "toll")
  - Attack: resolve at 1:1 odds
- [ ] Offensive fighter encounter (2:1 odds):
  - Auto-attack: defender sends `1.25 × (max_shields + max_figs)` fighters
  - If intruder survives, they enter the sector
- [ ] Tolled fighter encounter:
  - Pay 5 credits per fighter to pass
  - Or fight at 1:1 odds
- [ ] Fighter loss accounting: both sides lose fighters proportionally
- [ ] Web client: modal overlay for fighter encounter before sector view loads

**Success:** Hostile sectors feel dangerous. Players must fight or pay to enter.

---

## Phase 3: Ordered Combat Sequence (5-6 hours)
**Goal:** TW2002-authentic combat order of events

**Deliverables:**
- [ ] Sector entry order of events:
  1. Nav Hazard check (if implemented)
  2. Limpet Mine attachment (Phase 4)
  3. Armid Mine detonation (Phase 4)
  4. Sector Q-Cannon fire (Phase 5)
  5. Fighter encounter (Phase 2)
  6. Ship-to-ship combat (TW-05)
- [ ] Ship-to-ship combat order:
  1. Empty ships attack first
  2. Player ships attack in sign-on order
  3. Sector fighters resolved
- [ ] Web client: display combat sequence step-by-step (operations log)

**Success:** Combat feels authentic to TW2002 mechanics.

---

## Phase 4: Mines (5-6 hours)
**Goal:** Layered defenses beyond fighters

**Deliverables:**
- [ ] Limpet Mines: attach to hull on entry, can be removed at StarDock for a fee
- [ ] Armid Mines: 50% detonation chance per mine on entry, each does hull damage
- [ ] Mine purchase at StarDock
- [ ] Mine deployment in sectors (visible to owner, hidden to others)
- [ ] Mine detection: density scanner upgrade (or cloak bypass)

**Success:** Entering hostile sectors is increasingly dangerous.

---

## Phase 5: Blockades & Q-Cannons (5-6 hours)
**Goal:** Strategic denial and planetary defense

**Deliverables:**
- [ ] Blockade detection: sector info shows heavy fighter concentration
- [ ] Blockade types (simplified from TW2002):
  - **Scout Blockade:** light fig deployment around Stardock
  - **Fortress Blockade:** overwhelming fig concentration
- [ ] Q-Cannon damage formulas (per `../lore-reference/strategy/combat.md`):
  - Sector Q-Cannon: `(TotalOre * SectPct) / 3`
  - Atmospheric Q-Cannon: `TotalOre * AtmoPct * 2`
- [ ] Loot rebalance: raise ship-to-ship loot from 25% → 50% (now that layers exist)
- [ ] Offline protection: deployed fighters auto-defend; no more "offline = vulnerable"

**Success:** Corps can lock down sectors. Solo players need strategy to bypass.

---

## Phase 6: Corp Fighter Sharing (3-4 hours)
**Goal:** Team-based fighter accounting

**Deliverables:**
- [ ] Corp fighter pools: corp members can contribute figs to shared sector defense
- [ ] Corp fighter ownership tracking
- [ ] Fighter inheritance: if member quits, corp retains figs
- [ ] Web client: corp fighter management UI

**Success:** Team play becomes viable for sector control.

---

## Phase Completion Order
1 → 2 → 3 → 4 → 5 → 6

Phase 1-2 are the core (buy/deploy/encounter). Phases 3-4 add depth. Phase 5 is the strategic payoff (blockades). Phase 6 is social.

---

## Definition of Done
- Players can buy and deploy fighters
- Sector entry triggers fighter encounters
- Combat follows TW2002 order of events
- Mines add secondary defenses
- Blockades are possible
- Loot rebalanced to 50%
- Offline players are protected by deployed fighters
- Corp-level fighter sharing works

---

## Notes
- **This is the true TW2002 PvP experience.** Everything before this was scaffolding.
- **Reference the Stardock manual constantly.** `../lore-reference/strategy/combat.md` and `../lore-reference/strategy/blockades.md` are your bibles.
- **Fighter economy is the endgame.** The player who controls fighter production (via planets, TW-07) controls the galaxy.
