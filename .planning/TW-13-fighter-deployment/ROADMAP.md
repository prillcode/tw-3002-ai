# TW-13 Roadmap: Fighter Deployment & Sector Control

**Estimated Total:** 28-34 hours (4 focused sessions)

> **This is the leap from infrastructure to true TW2002 warfare.** Every phase adds a new defensive/offensive layer.
> 
> **No corporation mechanics.** Fighter ownership is individual only. Blockades are solo or ad-hoc — no corp sharing, no coordinated multi-player pools.

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

## Phase 3: Ordered Combat Sequence & Ship-to-Ship (5-6 hours)
**Goal:** TW2002-authentic combat order of events, including ship-to-ship resolution

**Deliverables:**
- [ ] Sector entry order of events:
  1. Nav Hazard check (if implemented)
  2. Limpet Mine attachment (Phase 4)
  3. Armid Mine detonation (Phase 4)
  4. Sector Q-Cannon fire (Phase 5)
  5. Fighter encounter (Phase 2)
  6. **Ship-to-ship combat** (if both survive fighter encounter and both are players)
- [ ] Ship-to-ship combat resolution:
  - Trigger: two (or more) player ships occupy same sector with no deployed fighters, OR both survive fighter encounter
  - Order: empty ships attack first → player ships attack in sign-on order → sector fighters resolved
  - Uses existing `resolveDefeat()` pipeline from TW-05 for consequences (loot, respawn, news)
  - Not a "duel" button — it's an automatic consequence of co-occupation after fighter resolution
- [ ] Web client: display combat sequence step-by-step (operations log)

**Success:** Combat feels authentic to TW2002 mechanics. Players know exactly what happened and why.

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
- [ ] Blockade types (simplified from TW2002, solo-player focused):
  - **Scout Blockade:** light fig deployment around Stardock
  - **Fortress Blockade:** overwhelming fig concentration by a single player
- [ ] Q-Cannon damage formulas (per `../lore-reference/strategy/combat.md`):
  - Sector Q-Cannon: `(TotalOre * SectPct) / 3`
  - Atmospheric Q-Cannon: `TotalOre * AtmoPct * 2`
- [ ] Loot rebalance: raise player defeat loot from 25% → 50% (now that layers exist)
- [ ] Offline protection: deployed fighters auto-defend; no more "offline = vulnerable"

**Success:** Players can lock down sectors. Rivals need strategy (backdoors, mine sweepers, overwhelming force) to bypass.

---

## Phase Completion Order
1 → 2 → 3 → 4 → 5

Phase 1-2 are the core (buy/deploy/encounter). Phase 3 adds authentic sequencing and ship-to-ship. Phase 4 adds depth. Phase 5 is the strategic payoff (blockades).

---

## Definition of Done
- Players can buy and deploy fighters
- Sector entry triggers fighter encounters
- Combat follows TW2002 order of events
- Ship-to-ship combat resolves when fighters don't settle the encounter
- Mines add secondary defenses
- Blockades are possible for individual players
- Loot rebalanced to 50%
- Offline players are protected by deployed fighters

---

## Notes
- **This is the true TW2002 PvP experience.** Everything before this was scaffolding.
- **Reference the Stardock manual constantly.** `../lore-reference/strategy/combat.md` and `../lore-reference/strategy/blockades.md` are your bibles.
- **Fighter economy is the endgame.** The player who controls fighter production (via planets, TW-14) controls the galaxy.
- **No corps.** Blockades are individual efforts. A single determined player with enough fighters can deny Stardock access.
- **Ship-to-ship is automatic, not opt-in.** In TW2002, if you enter a sector with another player and no fighters mediate, combat happens. There's no "challenge" button.
