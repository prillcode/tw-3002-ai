# TW 3002 AI — Session Handoff

Date: 2026-04-25
Version: CLI v0.6.0 | API v0.5.5 | Web Client v0.5.5
Repo: https://github.com/prillcode/tw-3002-ai

---

## This Session's Accomplishments

### 🎯 TW-05: PvP Infrastructure — FULLY DEPLOYED

All 5 phases built, tested, and live on `api.playtradewars.net` + `portal.playtradewars.net`:

| Phase | What Shipped |
|-------|-------------|
| **05-01** Loot & Respawn | `resolveDefeat()` central pipeline — 25% credits + 10% cargo loot, FedSpace respawn, insurance support. Hooked into NPC combat. |
| **05-02** Bounty & Wanted | `GET /bounty/board` lists wanted players. `GET /bounty/status` checks own status. 3+ kills in 24h = ☠ WANTED. |
| **05-03** News & Digest | Auto news on defeats/wanted changes. `GET /notifications/digest` — "While you were away..." shown on login. |
| **05-04** Leaderboards | Tabbed leaderboard: Net Worth / Kills / Deaths / Wanted. Wanted players show ☠ badge. Player stats API. |
| **05-05** Protections & Insurance | New player shield (<10k or <24h). FedSpace safe. Insurance at StarDock: 5% net worth → reduces death penalty 25%→5%. |

**Schema:** Migration `0003_pvp_infra.sql` applied (reputation, insurance_expires, indexes).

### 🔧 Polish & Fixes
- Warp lanes show danger indicators (● safe, ◐ caution, ◉ dangerous)
- Navigation/Leaderboard added to Actions panel
- Fixed duplicate Navigation Log entries (visit() dedupes)
- Version bumped to 0.5.5 across API and web client

### 📚 Documentation
- Fetched Stardock Modern Manual (~1,800 lines across 17 files) into `.planning/lore-reference/`
- Created `IDEAS.md` — post-PvP inspiration backlog (comm log, combat stances, fighters, heat)
- Wrote SUMMARY.md for TW-04, TW-05, and original TW-06
- Renamed fighter-deployment work item: TW-06 → **TW-13** (naming collision resolved)

### 📋 Planning — This Session's Work

**TW-05 Revised (Stardock Manual Review):**
- Reviewed all TW-05 plans against Stardock Modern Manual combat/blockade docs
- **Aggressive pivot:** Removed ship-to-ship PvP dueling entirely — not authentic TW2002, not reusable
- TW-05 is now **"PvP Infrastructure"** only: loot, respawn, bounty, news, leaderboards, protections
- Loot kept at 25% (conservative until defensive layers exist)
- Bounty system noted as placeholder for full alignment (TW-15)

**TW-12 Planned (Deferred):**
- API docs section for Astro site (`playtradewars.net/api/`)
- Rate limiting + action budget system (60 actions/hour)
- Fair Play philosophy page
- **Blocked:** Waiting for API to stabilize from other session

**TW-13 Updated:**
- Removed Phase 6 (Corp Fighter Sharing) — corporations excluded per project direction
- Added ship-to-ship combat as automatic consequence of co-occupation after fighter resolution
- Combat sequence: nav hazard → limpets → armids → Q-cannons → fighters → ship-to-ship
- Blockades are solo-player only

**TW-14 Created — Planets & Citadels:**
- 7 planet classes (M, K, O, L, C, H, U) with distinct production profiles
- Genesis Torpedo creation, colonist transport, FOE production bell curve
- Fighter production from FOE (n/10, n/12, n/15 per class)
- Citadel advancement levels 1-6 with class-specific costs
- Q-cannon damage formulas (sector + atmospheric)
- Planetary trading and transport

**TW-15 Created — Alignment System:**
- Good vs Evil dual-path progression (-1000 to +1000)
- Rob & Steal port mechanics (unlocked at -100 alignment, bust chance ~1/50)
- Commission + ISS unlock at +1000 alignment
- 22 ranks (Private → Fleet Admiral) with exponential experience requirements
- Experience gain from trading, combat, planet building

**Lore Reference Summary:**
- Created `.planning/lore-reference/tw2002-game-manual-summary.md` — distilled 17 files into single reference doc

---

## Current Work Item Status

| ID | Status | Description |
|----|--------|-------------|
| TW-05 | ✅ Complete | PvP Infrastructure (loot, respawn, bounty, news, insurance) |
| TW-12 | 📋 Planned | API Docs & Rate Limiting — **deferred until API stabilizes** |
| TW-13 | 📋 Ready | Fighter Deployment & Sector Control — updated, corp-free |
| TW-14 | 📋 Planned | Planets & Citadels — ready to scaffold after TW-13 Phase 2 |
| TW-15 | 📋 Planned | Alignment System (Good/Evil) — ready after TW-14 |

---

## Next Session: TW-13 Phase 1 — Fighter Purchase & Deployment

**Goal:** Players can buy fighters at StarDock and deploy them in sectors. First player-visible PvP.

### Planned Work
1. **Schema** — `sector_fighters` table, `fighters` column on `player_ships`, new ships start with 30 fighters
2. **API** — `POST /fighters/buy`, `POST /fighters/deploy`, `POST /fighters/recall`, `GET /fighters/sector`
3. **Web UI** — StarDock "Fighter Bay", DeployFightersModal (mode: Defensive/Offensive/Tolled), sector fighter indicators

### Files to Touch
- `cloud/migrations/0004_fighters.sql`
- `cloud/src/routes/fighters.ts` (new)
- `cloud/src/index.ts` (wire routes)
- `web/game/src/views/StarDockView.vue`
- `web/game/src/views/SectorView.vue`
- `web/game/src/components/DeployFightersModal.vue` (new)

### Reference
- `.planning/TW-13-fighter-deployment/phases/06-01-PLAN.md`
- `.planning/lore-reference/strategy/combat.md` — fighter accounting, combat odds
- `.planning/lore-reference/strategy/blockades.md` — sector control tactics

---

## Roadmap Context

**Dependency Chain:**
```
TW-05 (infra) → TW-13 Phases 1-2 (fighters) → TW-14 (planets) → TW-13 Phases 3-5 (Q-cannons/blockades) → TW-15 (alignment)
```

**Why TW-14 after TW-13 Phase 2:** Fighters without planets are just purchased commodities. Planets make fighters renewable — closing the economic loop that makes sector control meaningful.

**Explicitly Excluded:**
- Corporations / corp sharing / mixed-corp role splitting
- Player collusion mechanics of any kind
- Team blockades (solo blockades only)

---

*See you in the black, Commander.* 🌌
