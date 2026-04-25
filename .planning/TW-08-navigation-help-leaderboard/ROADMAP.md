# TW-08 Roadmap: Navigation, Help, and Leaderboard

**Estimated Total:** 3–4 hours (1 focused session)

## Phase 1: Navigation Log in Cloud Mode (1 hour)
**Goal:** Press `N` in cloud mode to see visited sectors.

**Deliverables:**
- [ ] Track `visitedSectorIds` in CloudSectorScreen state
- [ ] Add `N` key handler to open NavigationScreen
- [ ] Cloud-aware NavigationScreen (uses local visited state)
- [ ] Blast markers on ship destruction

**Success:** Players can retrace their cloud journey.

---

## Phase 2: Help Screen for Cloud Mode (30 min)
**Goal:** Press `H` in cloud mode to see controls.

**Deliverables:**
- [ ] Wire `onH` in CloudSectorScreen
- [ ] Add `cloud` to `HelpContext` type
- [ ] Document cloud-specific controls

**Success:** Help is accessible everywhere.

---

## Phase 3: Leaderboard Screen (1–2 hours)
**Goal:** Players can view top pilots in the galaxy.

**Deliverables:**
- [ ] `LeaderboardScreen` component
- [ ] Fetch from `GET /api/leaderboard?galaxyId=1`
- [ ] Display: rank, ship name, class, net worth, kills, deaths
- [ ] Accessible from Welcome menu or via key in sector view

**Success:** Competitive players chase rankings.

---

## Phase Completion Order
1 → 2 → 3

---

## Definition of Done
- `N` shows Navigation Log in cloud mode
- `H` shows Help in cloud mode
- Leaderboard displays top players
- All screens keyboard-navigable
