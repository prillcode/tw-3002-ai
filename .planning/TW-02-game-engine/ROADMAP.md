# TW-02 Roadmap: Game Engine

**Estimated Total:** 35-47 hours (4-6 focused sessions)

## Phase 1: Data Models & Types (2-3 hours)
**Goal:** TypeScript interfaces for all game entities

**Deliverables:**
- [ ] `shared/src/types/Galaxy.ts` — Sector, Connection, Port
- [ ] `shared/src/types/Player.ts` — Ship, Cargo, Credits, Upgrades
- [ ] `shared/src/types/Market.ts` — Commodity, Price, Supply/Demand
- [ ] `shared/src/types/Combat.ts` — Weapon, Shield, Hull, Damage
- [ ] `shared/src/types/NPC.ts` — Base NPC interface (for TW-03 extension)
- [ ] `shared/src/types/Events.ts` — NewsItem, Rumor, MarketEvent

**Success:** All game entities have strict TypeScript types.

---

## Phase 2: Galaxy Generator (4-6 hours)
**Goal:** Procedural galaxy creation

**Deliverables:**
- [ ] `src/galaxy/generator.ts` — createGalaxy(sectorCount)
- [ ] Sector placement (3D coords → 2D display projection)
- [ ] Connection algorithm (ensure galaxy is navigable)
- [ ] Port type distribution (Class I-III, Special)
- [ ] FedSpace placement (central safe zone)
- [ ] StarDock placement (upgrade hub)
- [ ] Seed-based generation (reproducible for testing)

**Success:** Can generate 100-sector galaxy with diverse ports.

---

## Phase 3: Economy Engine (6-8 hours)
**Goal:** Supply/demand price model

**Deliverables:**
- [ ] `src/economy/pricing.ts` — price calculation
- [ ] Base prices: Ore, Organics, Equipment
- [ ] Supply/demand curves (buy → price rises, sell → price falls)
- [ ] Port specialization (some buy high, sell low)
- [ ] Price history tracking (for player strategy)
- [ ] Market event system (temporary price spikes/crashes)

**Success:** Profitable trade routes exist and change over time.

---

## Phase 4: Trading System (4-5 hours)
**Goal:** Buy/sell with constraints

**Deliverables:**
- [ ] `src/trading/transaction.ts` — executeTrade()
- [ ] Cargo hold limits (per ship type)
- [ ] Credit validation (can't spend what you don't have)
- [ ] Port inventory limits (can't buy if they're sold out)
- [ ] Transaction logging (for player history)
- [ ] Profit/loss tracking

**Success:** Can complete full trade loops with real profit/loss.

---

## Phase 5: Ship Systems (5-6 hours)
**Goal:** Upgrades and ship stats

**Deliverables:**
- [ ] `src/ships/types.ts` — ShipClass (Merchant, Interceptor, etc.)
- [ ] `src/ships/upgrades.ts` — upgrade options
- [ ] Engines: speed (turns per move)
- [ ] Weapons: combat damage output
- [ ] Shields: damage absorption
- [ ] Cargo holds: capacity increases
- [ ] Hull: health points
- [ ] StarDock integration (buy/sell upgrades)

**Success:** Ship upgrades tangibly affect gameplay.

---

## Phase 6: Combat System (6-8 hours)
**Goal:** Risk/reward fighting

**Deliverables:**
- [ ] `src/combat/resolver.ts` — resolveCombat()
- [ ] Combat initiation (attack or be attacked)
- [ ] Turn-based rounds (attack, flee, bribe)
- [ ] Damage calculation (weapons vs shields/hull)
- [ ] Flee probability (speed-based escape chance)
- [ ] Bribe mechanics (pay off raiders)
- [ ] Combat logging (battle reports)
- [ ] Destruction → respawn in FedSpace

**Success:** Combat is dangerous but winnable with good ship/choices.

---

## Phase 7: Game State Manager (4-5 hours)
**Goal:** Centralized state validation

**Deliverables:**
- [ ] `src/state/GameState.ts` — immutable state container
- [ ] `src/state/validators.ts` — action validation (is move legal?)
- [ ] `src/state/reducers.ts` — pure state transitions
- [ ] Turn counter management
- [ ] Event queue (delayed effects)
- [ ] Save/load serialization

**Success:** All game actions are validated; no invalid states possible.

---

## Phase 8: Integration & Test (4-6 hours)
**Goal:** TW-01 integration, end-to-end playable

**Deliverables:**
- [ ] Hook engine into CLI screens
- [ ] Wire trading UI to economy engine
- [ ] Wire combat UI to combat resolver
- [ ] Wire navigation to galaxy generator
- [ ] Playable loop: login → trade → combat → save → logout
- [ ] Balance pass (prices, damage, upgrade costs)

**Success:** Full game playable via CLI, solo player experience complete.

---

## Phase Completion Order
1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

Phases 1-7 can proceed with mock UI. Phase 8 requires TW-01 completion.

---

## Definition of Done
- All 8 phases complete
- Galaxy generates, economy runs, trading works, combat resolves
- Player can "win" by amassing credits (or any defined goal)
- Code tested, balanced, and integrated with TW-01 CLI
- Ready for TW-03 NPC integration
