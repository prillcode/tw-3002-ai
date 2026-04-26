# TW-15 Roadmap: Alignment System

**Estimated Total:** 20-28 hours (3-4 focused sessions)

> **Good or Evil? The galaxy wants to know.** This system turns a number into an identity.

## Phase 1: Alignment Tracking & Actions (5-7 hours)
**Goal:** Alignment changes based on player actions

**Deliverables:**
- [ ] `alignment` and `experience` columns on `player_ships` table
- [ ] Alignment gain events:
  - Killing evil player/NPC: +alignment (amount varies by target)
  - Posting bounty on evil player: +1 alignment per 1,000 cr (placeholder for bounty system)
  - Building planet: +1 alignment per 2,000 cr invested
  - Upgrading port: +1 alignment per 5,000 cr invested
  - Paying taxes: +1 alignment per 1,500 cr
- [ ] Alignment loss events:
  - Destroying port: -50 alignment
  - Killing good player: -alignment (amount varies by target)
  - Robbing port (on bust): -alignment penalty
- [ ] `GET /player/alignment?galaxyId=` — current alignment, experience, rank
- [ ] Web client: alignment indicator in ship status, color-coded (blue = good, red = evil)

**Success:** Every meaningful action shifts alignment. Players feel the consequences of their choices.

---

## Phase 2: Rob & Steal (6-8 hours)
**Goal:** Evil-aligned players can rob and steal from ports

**Deliverables:**
- [ ] Port menu changes when alignment ≤ -100: adds Rob and Steal options
- [ ] `POST /action/rob` — rob port cash (actual = displayed + 11%)
- [ ] `POST /action/steal` — steal cargo from port dock
- [ ] Experience-based limits: max rob/steal amount scales with player experience
- [ ] Bust chance: base ~1/50, increases with amount above limit
- [ ] Bust penalties: lose 10% experience, lose holds proportional to attempt
- [ ] `GET /port/crime-status?galaxyId=&sectorId=` — rob/steal limits for current port
- [ ] Web client: crime overlay in MarketView when evil-aligned

**Success:** Evil play is profitable but risky. The bust mechanic creates tension.

---

## Phase 3: Commission & ISS (4-5 hours)
**Goal:** Good-aligned players unlock the ultimate ship

**Deliverables:**
- [ ] Commission endpoint: `POST /player/commission` (requires +1000 alignment, available at Stardock)
- [ ] Commission raises alignment to exactly 1,000 if below
- [ ] ISS unlock: Imperial StarShip appears in StarDock catalog once commissioned
- [ ] ISS stats: 50k max fighters, 2k shields, TransWarp drive, 4 turns/warp
- [ ] ISS cost: expensive (canonically 2M+ credits, tune for our economy)
- [ ] Web client: commission banner when approaching 1,000 alignment, ISS in ship catalog

**Success:** The ISS is a badge of honor and a massive power spike. Players grind for it.

---

## Phase 4: Rank Progression (4-5 hours)
**Goal:** Experience matters beyond alignment

**Deliverables:**
- [ ] 22-rank table from Private (2 exp) to Fleet Admiral (4,194,304 exp)
- [ ] Experience gain sources:
  - Trading: 1 exp per X credits profit
  - Combat: exp based on enemy strength
  - Planet building: exp per resource invested
  - Port upgrade: +50 exp per upgrade
- [ ] `GET /player/rank` — current rank, title, experience, next rank threshold
- [ ] Web client: rank badge in player profile, experience bar

**Success:** Even players who avoid PvP can progress via trading and building.

---

## Phase Completion Order
1 → 2 → 3 → 4

Phase 1 tracks alignment. Phase 2 unlocks evil mechanics. Phase 3 is the good payoff. Phase 4 adds long-term progression.

---

## Definition of Done
- Alignment changes from player actions
- Rob/steal available at -100 alignment with bust mechanics
- Commission and ISS unlock at +1000 alignment
- Rank progression tracks experience across 22 levels
- Alignment and rank visible in web client
- FedSpace survival rules respect alignment

---

## Notes
- **Alignment is intentionally hard to change.** In TW2002, going from 0 to +1000 costs ~500k-750k credits. It's a commitment.
- **Evil is more profitable short-term, good is more sustainable long-term.** SST yields ~17k/turn but requires constant attention. Paired-port trading is slower but safer.
- **No alignment switching.** Once you're deep evil, climbing back to good is expensive and time-consuming. This is intentional.
- **ISS is the good payoff.** Evil doesn't get an equivalent "ultimate ship" — they get profit. The asymmetry is part of the design.
