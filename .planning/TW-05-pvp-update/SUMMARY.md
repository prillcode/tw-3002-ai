# TW-05: PvP Infrastructure — Summary

## Status: ✅ Complete

**Date:** 2026-04-25
**Version:** API v0.5.5 | Web Client v0.5.5

---

## Overview

TW-05 builds the backend infrastructure that makes competitive PvP possible in TW 3002 AI. Notably, **this work item contains no player-visible combat mechanics** — those are deferred to TW-06 (Fighter Deployment & Sector Control). Instead, TW-05 creates the shared systems that any defeat event (NPC, fighter, or future PvP) will use.

**Design pivot during execution:** After reviewing the Stardock Modern Manual, we determined that "ship-to-ship dueling" is not authentic TW2002 combat and would not be reused once fighters are introduced. Ship dueling was removed from scope. TW-05 now builds purely reusable infrastructure.

---

## Phase 1: Loot, Respawn & Kill Tracking ✅

### Backend
- **`resolveDefeat()`** — Central pipeline in `cloud/src/routes/combat.ts`
  - Called by any system that defeats a player (NPC combat now, fighter encounters in TW-06)
  - Calculates loot: 25% credits + 10% cargo (conservative until defensive layers exist)
  - Insurance check: if active, reduces penalty to 5%
  - Respawns player in nearest FedSpace sector
  - Restores hull to max, clears shield, cargo partially looted
  - Records kill in `pvp_kills` table
  - Generates news item automatically

- **Hooked into NPC combat** — `handleCombat()` in `action.ts` now calls `resolveDefeat()` on player destruction instead of inline respawn logic

### Schema
- `pvp_kills` table already existed; now populated with killer, victim, sector, loot, timestamp
- Added indexes: `idx_pvp_kills_galaxy`, `idx_pvp_kills_killer`, `idx_pvp_kills_victim`

---

## Phase 2: Bounty & Wanted System ✅

### Backend
- **`GET /api/bounty/board`** — Lists players with 3+ kills in last 24 hours
- **`GET /api/bounty/status`** — Returns own wanted status, kill count, decay timer
- Wanted threshold: 3+ kills in 24h (window configurable)
- Wanted decay: -1 kill every 48h of no activity
- News item auto-generated on wanted status change

### Web Client
- Wanted indicator (☠) shown on leaderboard entries
- Ship status panel shows "☠ WANTED (N)" when applicable

**Note:** This is a **placeholder** for a full alignment system (good/evil paths, reward posting, ISS unlocks). See `../lore-reference/alignment/` for TW2002's full alignment mechanics.

---

## Phase 3: News & Notifications ✅

### Backend
- **News generation** triggers automatically on:
  - Player defeated by NPC
  - Player wanted status placed/cleared
- **`GET /api/notifications/digest`** — "While you were away" summary
  - Returns kills, deaths, and news since last login
  - Updates `players.last_login_at` on fetch

### Web Client
- **Login digest** — After auth, if player had deaths or news while offline:
  ```
  📡 While you were away...
  💥 1 death(s)
  • DarkReaver destroyed you in Sector 42
  ```
- Digest shown on `LoginView.vue` with "Enter Galaxy →" button

### Discord Webhooks
- Placeholder function exists in `combat.ts` (`sendDiscordNotification`)
- **Not yet wired** — requires player settings store for webhook URL (TW-11)

---

## Phase 4: Leaderboards & Stats ✅

### Backend
- **`GET /api/player/stats`** — kills, deaths, K/D ratio, reputation, wanted status, net worth, insurance
- **`GET /api/leaderboard?sort=`** — Extended with `sort` parameter:
  - `sort=networth` (default)
  - `sort=kills`
  - `sort=deaths`
  - `sort=wanted` — shows recent_kill count for each player

### Web Client
- **Tabbed leaderboard** (`LeaderboardView.vue`):
  - Net Worth | Kills | Deaths | Wanted
  - Current player highlighted
  - Wanted players show ☠ badge

---

## Phase 5: Protections & Balance ✅

### Backend
- **New player protection** — <10,000 net worth OR account <24h old = invulnerable to defeat
- **FedSpace protection** — No defeats possible in `danger = 'safe'` sectors
- **Self-attack prevention** — `resolveDefeat()` aborts if attacker == victim
- **Insurance system**:
  - `POST /api/insurance/buy` — Purchase at StarDock for 5% of net worth
  - Duration: 7 days
  - Effect: reduces death penalty from 25% → 5%
  - `GET /api/insurance/status` — Check if active

### Web Client
- Ship status panel shows K/D, wanted status, insurance status
- StarDockView has insurance purchase UI with cost display
- CombatView reloads ship state from server after destruction (handles respawn correctly)

---

## Files Changed

| File | Purpose |
|------|---------|
| `cloud/src/routes/combat.ts` | **New.** `resolveDefeat()`, bounty, insurance, digest endpoints |
| `cloud/src/routes/action.ts` | Hooked NPC combat into `resolveDefeat()` |
| `cloud/src/routes/news.ts` | Extended leaderboard with `sort` param |
| `cloud/src/index.ts` | Routed new endpoints |
| `cloud/migrations/0003_pvp_infra.sql` | reputation, insurance_expires, indexes |
| `web/game/src/stores/ship.ts` | Added kills, deaths, stats, insurance fields |
| `web/game/src/views/SectorView.vue` | Shows K/D, wanted, insurance in ship status |
| `web/game/src/views/CombatView.vue` | Reloads ship from server after destruction |
| `web/game/src/views/LeaderboardView.vue` | Tabbed leaderboard with all sorts |
| `web/game/src/views/StarDockView.vue` | Insurance purchase UI |
| `web/game/src/views/LoginView.vue` | Digest display on login |

---

## API Endpoints Added

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/player/stats` | GET | Kills, deaths, K/D, wanted, insurance |
| `/api/bounty/board` | GET | List wanted players |
| `/api/bounty/status` | GET | Own wanted status |
| `/api/notifications/digest` | GET | "While you were away" summary |
| `/api/insurance/buy` | POST | Purchase insurance at StarDock |
| `/api/insurance/status` | GET | Check insurance status |

---

## Design Decisions

1. **No ship dueling** — Removed from scope. True TW2002 PvP is fighter-based (TW-06).
2. **Conservative loot (25%)** — Will raise to 50% after TW-06 fighters provide defense.
3. **Central `resolveDefeat()`** — Any defeat event (NPC, fighter, future PvP) calls one pipeline.
4. **Insurance as soft-protection** — Players who hate risk can buy safety. Bounty system is hard-protection.
5. **Digest on login** — Async-friendly; no real-time notifications needed for turn-based game.

---

## Verification Checklist

- [x] Player destroyed by NPC → respawns in FedSpace, loses 25% credits, death counted
- [x] Loot calculation correct (25% credits, 10% cargo)
- [x] `pvp_kills` row inserted with correct data
- [x] News item generated on defeat
- [x] Wanted status triggers at 3+ kills in 24h
- [x] Bounty board lists wanted players
- [x] Digest shows events since last login
- [x] Leaderboard has Net Worth / Kills / Deaths / Wanted tabs
- [x] New player (<10k net worth) cannot be defeated
- [x] FedSpace prevents defeat
- [x] Insurance reduces death penalty to 5%
- [x] Web client shows K/D, wanted, insurance in ship status

---

## What's Next

- **TW-06: Fighter Deployment & Sector Control** — First player-visible PvP. Buy/deploy fighters, sector entry encounters, ordered combat sequence.
- **TW-11: Email & Player Polish** — SMTP magic links, Discord webhooks, player settings (including PvP toggle).
