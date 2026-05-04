# Phase 02 Summary: Daily Bounty System — Web Client

**Status:** ✅ Complete & Deployed  
**Date:** 2026-05-03  
**Work Item:** TW-19 — Leaderboards & Daily Bounties

---

## What Was Built

### MissionPanel Component (`web/game/src/components/MissionPanel.vue`)
- Self-contained modal component that fetches and displays daily missions
- **Progress bars**: Animated width based on `progress` percentage
- **Mission labels**: Human-readable names (Hunt Pirates, Trade Profits, Explore Sectors, Colonize Planets, Pay CHOAM Tariffs)
- **Visual states**:
  - Active: `border-void-600`
  - Completed (unclaimed): `border-terminal-green/50 bg-terminal-green/5` + green "Claim" button
  - Claimed: `border-terminal-muted/30 opacity-60` + "✓ Claimed" badge
- **Claim button**: Calls `POST /api/player/missions/claim`, refreshes ship credits via `ship.loadShip()`
- **Reroll button**: Shows cost (`max(500, reward*0.5)`), calls `POST /api/player/missions/reroll`, refreshes mission list
- **All-claimed message**: "🎉 All bounties claimed! New missions at 00:00 UTC."

### SectorView Integration (`web/game/src/views/SectorView.vue`)
- **Action button**: "📋 Daily Bounties [B]" added to left action panel
- **Modal content**: `MissionPanel` rendered inside the existing Teleport modal system when `ui.activeModal === 'missions'`
- **Keyboard shortcut**: `B` key opens mission panel (alongside existing H, N, L, etc.)
- **Help modal**: Added `B` → Daily Bounties to the keyboard reference grid

### Toast Notification System
- `missionToast` ref: `{ message: string; visible: boolean } | null`
- `lastMissions` ref: tracks previous mission completion states
- `checkMissionProgress()`: Silently fetches missions after gameplay actions, detects newly completed missions, shows toast for 4 seconds
- Called after: `handleJump()` (successful move), `handleEncounterResolved()` (successful encounter), `onMounted()` (initial load)
- Toast styling: `terminal-panel` with green border, pulsing animation, fixed top-right position

### Version
- Game client: v0.6.5 (already bumped in Phase 01 deploy)

---

## Files Changed

| File | Action |
|---|---|
| `web/game/src/components/MissionPanel.vue` | Created |
| `web/game/src/views/SectorView.vue` | Modified (import, button, modal content, keyboard handler, help text, toast system, progress check) |

---

## Verification Results

- ✅ `vue-tsc --noEmit` — clean TypeScript
- ✅ `vite build` — production build succeeds
- ✅ Deployed to `https://portal.playtradewars.net` via Cloudflare Pages
- ✅ All existing functionality preserved (no breaking changes)

---

## Issues / Notes

- The `ship` store doesn't expose a `refresh()` method; used `ship.loadShip(galaxyId)` instead for credit refresh after claim/reroll
- Toast detection relies on comparing previous vs current mission states. If the user has the missions panel open when a mission completes, they'll see both the toast and the UI update.
- Mission progress is only checked after move/encounter and on mount. Trade progress (selling at a port) happens in `MarketView.vue` (a separate route), so trade mission completion will only be detected when the user returns to `SectorView` or refreshes.

---

## Next Phase

**Phase 03 — Leaderboard Enhancements**
- Weekly / All-Time ranking tabs
- New stats: Planets Held, Alignment/Experience, Total Trades
- Player public profile pages
