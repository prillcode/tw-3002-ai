# TW-14 Roadmap: Planets & Citadels

**Estimated Total:** 28-36 hours (4-5 focused sessions)

> **Planets turn fighters from a purchased resource into a renewable one.** This is the economic endgame.

## Phase 1: Planet Creation & Colonization (6-8 hours)
**Goal:** Players can create planets and populate them

**Deliverables:**
- [ ] `POST /planets/create` — launch Genesis Torpedo in current sector (cost: 80,000 cr)
- [ ] Planet class randomization with weighted probabilities (M/K/O/L/C/H/U)
- [ ] Sector crowding modifier: more planets → higher U-class chance (up to ~98%)
- [ ] D1 schema: `planets` table (galaxy_id, sector_index, owner_id, class, colonists, fuel, org, eq, citadel_level, created_at)
- [ ] `POST /planets/colonize` — transport colonists from FedSpace to planet
- [ ] Colonist transport mechanics: 10 fuel/sector, cost from ship credits
- [ ] Population cap per class (M: 30k, K: 40k, O: 200k, L: 40k, C: 100k, H: 100k, U: 3k)
- [ ] Web client: Planet creation UI, colonization panel

**Success:** Players can create planets and seed them with colonists.

---

## Phase 2: Production & Daily Tick (6-8 hours)
**Goal:** Planets produce resources and fighters automatically

**Deliverables:**
- [ ] Daily production tick (Cron Trigger or turn-based): FOE output per planet
- [ ] Bell curve production: max at 50% of colonist capacity, die-off above 100%
- [ ] Fighter production from FOE: apply class-specific formula (M: n/10, L: n/12, O: n/15, etc.)
- [ ] Planet inventory tracking: fuel, organics, equipment stored on planet
- [ ] `GET /planets/:id` — planet status, production rates, inventory
- [ ] Web client: Planet dashboard showing daily output, colonist count, stored resources

**Success:** Planets generate fighters daily. Players check their planets like checking a bank account.

---

## Phase 3: Citadel Advancement (6-8 hours)
**Goal:** Players upgrade planet defenses and unlock advanced features

**Deliverables:**
- [ ] `POST /planets/citadel/advance` — spend resources to advance citadel level
- [ ] Citadel levels 1-6 with class-specific resource costs (see `../lore-reference/core/planets.md`)
- [ ] Level 1: basic defenses, fighter deployment from planet
- [ ] Level 4: production boost, planetary trading unlocked
- [ ] Level 6: maximum defenses, Q-cannon + atmospheric cannon
- [ ] Web client: Citadel advancement UI with cost preview and progress

**Success:** Players invest in planet development and unlock progressively stronger defenses.

---

## Phase 4: Q-Cannons & Planetary Defense (5-6 hours)
**Goal:** Planets defend themselves and their sector

**Deliverables:**
- [ ] Sector Q-Cannon: fires on entry, formula `(TotalOre * SectPct) / 3`
- [ ] Atmospheric Q-Cannon: fires when landing on planet, formula `TotalOre * AtmoPct * 2` (MBBS)
- [ ] Q-Cannon settings: owner configurable SectPct and AtmoPct (0-100)
- [ ] Shield integration: planetary shields (20:1 odds) must be destroyed before planet can be claimed
- [ ] Web client: Q-cannon configuration panel, shield status display

**Success:** Owned planets are dangerous to approach. Attackers need overwhelming force or photons.

---

## Phase 5: Planetary Trading & Transport (4-5 hours)
**Goal:** Planets participate in the economy

**Deliverables:**
- [ ] `POST /planets/transport` — move planet to adjacent sector (10 fuel/sector, 1 turn)
- [ ] Planetary trading: move planet under a port, sell planet cargo, buy new cargo
- [ ] `POST /planets/trade` — sell planet's FOE to port, buy different commodity
- [ ] Transport cost: 50,000 cr initial + 25,000/hop from ship credits
- [ ] Web client: Planet transport map, trade interface

**Success:** Planets are mobile economic assets, not static bases.

---

## Phase Completion Order
1 → 2 → 3 → 4 → 5

Phase 1 creates the asset. Phase 2 makes it productive. Phase 3 adds defenses. Phase 4 makes it dangerous. Phase 5 makes it mobile.

---

## Definition of Done
- Players can create planets with randomized classes
- Planets produce FOE and fighters daily
- Colonist mechanics follow bell curve production
- Citadel advancement unlocks defenses level by level
- Q-cannons fire with correct damage formulas
- Planetary trading and transport work
- All planet data visible in web client

---

## Notes
- **Genesis Torpedo cost (80k cr) is from TWGS settings.** May need tuning for our economy.
- **U-class probability shift is a key strategic mechanic.** Players must decide whether to fill a sector to capacity (risking U-class) or keep it sparse.
- **No shared planets.** Every planet has a single owner. If you want to "help" someone, you give them credits or fighters directly.
- **Daily tick vs turn-based:** Recommend Cron Trigger (every hour) for production, so planets grow even when player is offline.
