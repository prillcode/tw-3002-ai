# TW-19 Roadmap: Leaderboards & Daily Bounties

**Estimated Total:** 6–8 hours (2–3 focused sessions)

## Phase 01 — Daily Bounty System: Server (2–3 hours)
**Goal:** Players get 3 rotating daily missions with credit rewards.

**Deliverables:**
- [ ] D1 migration: `player_daily_missions` table
- [ ] Mission generator logic: 5 mission types, difficulty-weighted
  - Kill N NPCs / players
  - Earn N credits from trading
  - Visit N new sectors
  - Claim/defend a planet
  - Pay CHOAM tariffs
- [ ] `GET /api/player/missions` — fetch today's missions
- [ ] `POST /api/player/missions/claim` — claim reward for completed mission
- [ ] `POST /api/player/missions/reroll` — reroll one mission (costs credits)
- [ ] Background progress tracking: hook into existing action endpoints (combat, trade, move, planet)
- [ ] UTC midnight reset (checked on every mission fetch)

**Success:** Players have structured daily goals with tangible rewards.

---

## Phase 02 — Daily Bounty System: Web Client (2 hours)
**Goal:** Players can see, track, and claim missions in the game UI.

**Deliverables:**
- [ ] Mission panel/component (accessible from SectorView via key or button)
- [ ] Progress bars for active missions
- [ ] "Claim Reward" button for completed missions
- [ ] "Reroll" button with credit cost confirmation
- [ ] Visual distinction for completed vs active missions
- [ ] Toast/notification on mission completion

**Success:** Daily missions are discoverable and satisfying to complete.

---

## Phase 03 — Leaderboard Enhancements (2–3 hours)
**Goal:** Leaderboard feels like a competitive social feature, not just a data dump.

**Deliverables:**
- [ ] New leaderboard tabs: Weekly, All-Time
- [ ] New ranking dimensions: Planets Held, Alignment/Experience, Total Trades
- [ ] Weekly leaderboard backed by `player_weekly_stats` table (reset Monday 00:00 UTC)
- [ ] Player public profile page (`/player/:playerId` or modal)
  - Ship name, class, rank, alignment
  - Kills/deaths, net worth history graph (optional)
  - Current planets held
  - Recent news/activity
- [ ] Click player on leaderboard → open profile

**Success:** Players chase rankings and inspect competitors.

---

## Phase Completion Order
01 → 02 → 03

---

## Definition of Done
- Daily missions generate, track, reward, and reset correctly
- Leaderboard has weekly/all-time/planets/experience tabs
- Player profiles are accessible and informative
- All features work end-to-end in the web client
- API endpoints have rate limits
- D1 migrations are created and documented
