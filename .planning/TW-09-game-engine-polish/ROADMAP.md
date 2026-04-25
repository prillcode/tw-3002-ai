# TW-09 — Game Engine Polish Roadmap

## Phase 01 — Combat Balance
Tune the combat resolver so fights feel fair, dangerous, and narratively interesting.

- [ ] 01-01: Review and tune base damage values (player vs NPC)
- [ ] 01-02: Balance flee chance formula (class + engine upgrades should matter)
- [ ] 01-03: Tune bribe logic (cost vs enemy greed, refusal chance)
- [ ] 01-04: Review shield absorption (50% may be too strong or too weak)
- [ ] 01-05: Add combat difficulty scaling (enemy strength vs distance from FedSpace)
- [ ] 01-06: Test combat outcomes across all three ship classes

## Phase 02 — Trade Economy Balance
Make trading profitable but not exploitable. Ensure port inventory behaves realistically.

- [ ] 02-01: Tune base prices and price elasticity (supply/demand curves)
- [ ] 02-02: Balance restock rates per port class
- [ ] 02-03: Prevent negative supply and supply overflow edge cases
- [ ] 02-04: Ensure profitable trade routes exist but require exploration
- [ ] 02-05: Cloud trade parity (local and cloud should use the same pricing logic)
- [ ] 02-06: Add price floor/ceiling clamps to prevent runaway inflation

## Phase 03 — Ship Class & Turn Balance
Ensure each class feels distinct and viable. Make turns matter without being punishing.

- [ ] 03-01: Review Merchant vs Scout vs Interceptor stats
- [ ] 03-02: Tune starting credits, hull, cargo, turns per class
- [ ] 03-03: Balance upgrade costs and effects (are Mk III upgrades worth the price?)
- [ ] 03-04: Review turn regeneration rate (1/hour may be too slow or too fast)
- [ ] 03-05: Consider turn bonuses for certain actions (first login of day, etc.)

## Phase 04 — NPC Behavior Tuning
Make NPCs feel strategic rather than random.

- [ ] 04-01: Tune NPC aggression thresholds by type and distance from FedSpace
- [ ] 04-02: Improve trader pathfinding (move toward ports, not randomly)
- [ ] 04-03: Add NPC self-preservation (low hull → flee or hide)
- [ ] 04-04: Balance NPC spawn density and strength vs galaxy size
- [ ] 04-05: Ensure NPC ticks don't create "dead zones" or overcrowded sectors

## Phase 05 — Edge Cases & Hardening
Fix exploits, prevent invalid states, and add defensive checks.

- [ ] 05-01: Audit for negative values (cargo, credits, hull, supply, turns)
- [ ] 05-02: Fix division by zero in pricing when supply reaches zero
- [ ] 05-03: Prevent cargo overflow after upgrades
- [ ] 05-04: Ensure destroyed player respawns correctly in both local and cloud
- [ ] 05-05: Add runtime assertions for critical invariants
- [ ] 05-06: Write balance test suite (simulate 100 trades, 100 combats, verify distributions)
