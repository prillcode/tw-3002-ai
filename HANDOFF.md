# TW 3002 AI — Session Handoff

Date: 2026-04-24
Current version: CLI v0.6.0 | Cloud API v0.5.0 | Web Client v0.5.0
Repo: https://github.com/prillcode/tw-3002-ai

---

## What Was Accomplished This Session

### 🌐 All Three Web Properties Are LIVE

| Property | URL | Status |
|----------|-----|--------|
| Marketing + Docs | `https://playtradewars.net` | ✅ Astro site with landing page + game guide |
| Web Game Client | `https://portal.playtradewars.net` | ✅ Vue 3 SPA with full gameplay |
| Cloud API | `https://api.playtradewars.net` | ✅ Worker with CORS, custom domain |

### Web Client Features Implemented
- **Sector View** — Ship stats, warp lanes, sector info, sector map visualization, NPC list, news ticker
- **Market Overlay** (`M`) — Buy/sell all 3 commodities with live prices, supply, quantity selector
- **StarDock Overlay** (`D`) — Upgrade catalog, purchase with prerequisites, stat updates
- **Combat Overlay** — Attack/flee/bribe, narrative text, all outcomes (win/lose/destroyed)
- **Leaderboard** (`L`) — Full-page ranked table with net worth, K/D, ship class
- **Navigation Log** (`N`) — Breadcrumb trail of visited sectors with names and danger colors
- **Warp Jump Animation** — 800ms CSS radial burst + star streaks + CRT scanlines
- **Keyboard Shortcuts** — M, D, N, H, L, Esc, ↑↓, Enter all wired
- **Sector Map** — Visual neighbor display with connection lines, color-coded icons
- **Ship Stats** — Correct base stats per class (Merchant/Scout/Interceptor) + upgrades apply immediately

### CLI Cloud Mode (Previously Completed)
- Trade prices from `port_inventory_json`
- StarDocks with upgrade purchases
- NPC ticks via Cron Trigger (every 5 min)
- Navigation log, Help screen, Leaderboard
- Combat narrative generation

---

## What's Next — Priority Order

### 🔥 P0 — Quick Fixes

1. **Combat doesn't remove dead NPC** — After winning combat, the defeated raider still shows in the sector list until you jump away. Easy fix: remove it from `npcs.value` locally after a win in `CombatView.vue`.

2. **Destroyed player respawn** — After ship destruction, the web client doesn't reload ship data from server, so the respawn sector might be wrong visually until refresh. Call `ship.loadShip(galaxyId)` after a destroyed combat result.

### 🎯 P1 — Next Features

3. **TW-05 PvP Infrastructure** — Aggressive pivot: no ship-to-ship dueling. Build the reusable backend: loot pipeline, respawn logic, kill tracking, bounty/wanted system, news generation, notifications, leaderboards, protections. See `.planning/TW-05-pvp-update/phases/05-01-PLAN.md`.

4. **TW-06 Fighter Deployment** — True TW2002 PvP. Buy/deploy fighters in sectors (defensive/offensive/tolled). Sector entry encounters. Blockades. Mines. Q-Cannons. See `.planning/TW-06-fighter-deployment/phases/06-01-PLAN.md`.

5. **Web client settings** — Sound toggle, animation toggle, colorblind mode, font size. Add a gear icon or `S` key.

### 📝 P2 — Polish & Backlog

5. **TW-09 Game Engine Polish** — Combat balance, trade economy tuning, ship class differentiation, NPC behavior. See `.planning/TW-09-game-engine-polish/`.

6. **TW-11 Email & Player Polish** — Email verification, anti-spam, player profiles, avatars. See `.planning/TW-11-email-player-polish/`.

7. **Mobile polish** — User reports it renders fine on phone, but the sector map is 320px fixed which may overflow on very small screens. Could tighten padding/scale.

8. **Combat screen shake** — When taking damage in combat, add a CSS shake animation to the panel.

---

## Testing Commands

```bash
# Web client
curl -s https://portal.playtradewars.net | head -5

# API health
curl -s https://api.playtradewars.net/health

# Test auth flow
curl -s -X POST https://api.playtradewars.net/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}' | jq .

# Deploy Worker
cd cloud && npx wrangler deploy

# Deploy web (auto via Git integration)
# Just push to main, Pages rebuilds automatically
```

---

## Critical Files for Next Session

- `web/game/src/views/CombatView.vue` — **remove dead NPC from npcs.value after win**
- `web/game/src/views/CombatView.vue` — **reload ship data after destruction**
- `cloud/src/routes/action.ts` — **loot/respawn pipeline goes here**
- `cloud/src/routes/player.ts` — **stats endpoint goes here**
- `.planning/TW-05-pvp-update/phases/05-01-PLAN.md` — **loot/respawn/kill tracking plan**
- `.planning/TW-06-fighter-deployment/phases/06-01-PLAN.md` — **fighter deployment plan**

---

## Known Issues

1. **Combat doesn't remove dead NPC** — After winning combat, the NPC still appears in the sector list until you jump away.
2. **Destroyed player respawn** — Web client doesn't reload ship data after destruction, so respawn sector may be wrong visually.
3. **No settings page** — No way to toggle sound, animations, or accessibility options.

---

## Version Bump Locations

When releasing:
1. `cli/src/index.tsx` — `const VERSION`
2. `cli/package.json` — version field
3. `cli/src/screens/HelpScreen.tsx` — footer text
4. `cloud/package.json` — version field
5. `cloud/src/index.ts` — health check version
6. `web/game/package.json` — version field
7. `web/game/src/views/LoginView.vue` — "Web Client vX.Y.Z"

---

## Next Immediate Step

**Fix dead NPC persistence** — In `CombatView.vue`, after a successful combat result (`result.won`), emit an event or call a callback that removes the defeated NPC from `SectorView.vue`'s `npcs` array. Simplest: add a `combatResult` event emitter from CombatView, listen in SectorView to filter out the dead NPC.

After that: **reload ship after destruction** — In `CombatView.vue`, if `result.destroyed` is true, call `ship.loadShip(galaxyId)` before navigating back to update the sector position.

---

*See you in the black, Commander.* 🌌
