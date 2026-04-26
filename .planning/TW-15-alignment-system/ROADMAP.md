# TW-15 Roadmap: Alignment System

**Estimated Total:** 22-30 hours (3-4 focused sessions)

> **Good or Evil? The galaxy wants to know.** This system turns a number into an identity — and determines how every faction in the galaxy treats you.
>
> **Faction interaction rules come from the Universe Bible:** `../lore-reference/UNIVERSE-BIBLE.md`

## Phase 1: Alignment Tracking & Faction Standing (6-8 hours)
**Goal:** Alignment changes based on player actions; NPCs react to player alignment

**Deliverables:**
- [ ] `alignment` and `experience` columns on `player_ships` table
- [ ] Alignment gain events:
  - Killing Sardaukar/evil player/NPC: +alignment (amount varies by target)
  - Posting bounty on evil player: +1 alignment per 1,000 cr (placeholder for bounty system)
  - Building planet: +1 alignment per 2,000 cr invested
  - Upgrading port: +1 alignment per 5,000 cr invested
  - Paying CHOAM tariffs: +1 alignment per 1,500 cr
- [ ] Alignment loss events:
  - Destroying port: -50 alignment
  - Killing good player: -alignment (amount varies by target)
  - Robbing port (on bust): -alignment penalty
- [ ] `GET /player/alignment?galaxyId=` — current alignment, experience, rank, faction standing
- [ ] **Sardaukar targeting:** Sardaukar NPCs have increased encounter rate vs good-aligned players
- [ ] **Fremen neutrality:** Fremen-deployed fighters do not toll evil-aligned players ("friends of the desert")
- [ ] **NPC alignment awareness:** Fighter encounters and NPC combat check player alignment for faction-specific behavior
- [ ] Web client: alignment indicator in ship status, color-coded (blue = good/CHOAM, red = evil/outlaw)

**Success:** Every meaningful action shifts alignment. Sardaukar hunt good players. Fremen tolerate evil players. The galaxy reacts to who you are.

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

## Phase 3: Guild Commission & Guild Navigator Ship (4-5 hours)
**Goal:** Good-aligned players earn a Guild Commission and unlock the ultimate ship

**Deliverables:**
- [ ] Commission endpoint: `POST /player/commission` (requires +1000 alignment, available at StarDock)
- [ ] CHOAM grants Guild Commission, raising alignment to exactly 1,000 if below
- [ ] Guild Navigator (ISS-equivalent) unlock: appears in StarDock catalog once commissioned
- [ ] Guild Navigator stats: 50k max fighters, 2k shields, TransWarp drive, 4 turns/warp
- [ ] Guild Navigator cost: expensive (canonically 2M+ credits, tune for our economy)
- [ ] TransWarp requires melange consumption (1 unit per jump) — mechanical tie to TW-18 melange system
- [ ] Web client: commission banner when approaching 1,000 alignment, Guild Navigator in ship catalog

**Success:** The Guild Navigator is a badge of honor and a massive power spike. Players grind for it.

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

Phase 1 tracks alignment and faction behavior. Phase 2 unlocks evil mechanics. Phase 3 is the good payoff (Guild Commission + Guild Navigator). Phase 4 adds long-term progression.

---

## Definition of Done
- Alignment changes from player actions
- Sardaukar NPCs target good-aligned players more aggressively
- Fremen fighters do not toll evil-aligned players
- Rob/steal available at -100 alignment with bust mechanics
- Guild Commission and Guild Navigator unlock at +1000 alignment
- Rank progression tracks experience across 22 levels
- Alignment and rank visible in web client
- CHOAM Protected Space survival rules respect alignment

---

## Notes
- **Alignment is intentionally hard to change.** In TW2002, going from 0 to +1000 costs ~500k-750k credits. It's a commitment.
- **Evil is more profitable short-term, good is more sustainable long-term.** SST yields ~17k/turn but requires constant attention. Paired-port trading is slower but safer.
- **No alignment switching.** Once you're deep evil, climbing back to good is expensive and time-consuming. This is intentional.
- **Guild Navigator is the good payoff.** Evil doesn't get an equivalent "ultimate ship" — they get profit. The asymmetry is part of the design.
- **Fremen neutrality is not "evil friendly."** Fremen tolerate evil players because they share an enemy (CHOAM). But Fremen are not allies — they're still dangerous.
- **Sardaukar targeting good players is deliberate.** Good players have CHOAM protection in safe space. In deep space, they're priority targets. Risk/reward.
- **TransWarp + melange dependency** means the Guild Navigator's power comes at an ongoing cost — spice consumption.
