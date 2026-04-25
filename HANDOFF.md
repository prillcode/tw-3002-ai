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
- **Keyboard Shortcuts** — M, D, N, H, L, Esc, ↑↓, Enter all wired
- **Sector Map** — Visual neighbor display with connection lines, color-coded icons

### CLI Cloud Mode (Previously Completed)
- Trade prices from `port_inventory_json`
- StarDocks with upgrade purchases
- NPC ticks via Cron Trigger (every 5 min)
- Navigation log, Help screen, Leaderboard
- Combat narrative generation

---

## What's Next — Priority Order

### 🔥 P0 — Fix Before Anyone Notices

1. **Web client ship stats are wrong** — `web/game/src/stores/ship.ts` hardcodes `maxCargo: 120` and `maxHull: s.hull`. It should use `computeEffectiveStats()` from the engine package. Right now all ships feel identical regardless of class or upgrades.

2. **Web client Leaderboard is a placeholder** — `LeaderboardView.vue` says "Coming soon." The API endpoint works. Just needs a table component.

3. **Web client Navigation is a placeholder** — `NavigationView.vue` says "Coming soon." The visitedIds are tracked in the galaxy store. Just needs the breadcrumb UI.

### 🎯 P1 — Next Features

4. **TW-05 PvP Combat** — Big feature. Needs server endpoints (`/api/action/pvp/attack`, `/api/action/pvp/resolve`, `/api/action/pvp/status`) and web client UI. See `.planning/TW-05-pvp-update/phases/05-01-PLAN.md`.

5. **Web client responsive design** — Currently desktop-only. The sector view grid breaks on mobile. Consider a mobile layout: ship stats stacked, warp lanes as a list, map hidden or collapsible.

6. **Web client animations** — Warp jumps feel instant. Add a CSS transition or screen flash when jumping sectors. Combat could use a shake effect.

### 📝 P2 — Polish & Backlog

7. **TW-09 Game Engine Polish** — Combat balance, trade economy tuning, ship class differentiation, NPC behavior. See `.planning/TW-09-game-engine-polish/`.

8. **TW-11 Email & Player Polish** — Email verification, anti-spam, player profiles, avatars. See `.planning/TW-11-email-player-polish/`.

9. **Web client settings** — Sound toggle, animation toggle, colorblind mode, font size.

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

- `web/game/src/stores/ship.ts` — **needs computeEffectiveStats()**
- `web/game/src/views/LeaderboardView.vue` — **placeholder, needs table**
- `web/game/src/views/NavigationView.vue` — **placeholder, needs breadcrumb**
- `cloud/src/routes/action.ts` — **PvP endpoints go here**
- `cloud/src/routes/player.ts` — **PvP status endpoint goes here**
- `packages/engine/src/ships/upgrades.ts` — **computeEffectiveStats() source**

---

## Known Issues

1. **Ship stats hardcoded in web** — Merchant/Scout/Interceptor all show same stats. Upgrades don't visually update stats until page refresh.
2. **Leaderboard not implemented in web** — Modal shows "Coming soon."
3. **Navigation log not implemented in web** — Modal shows "Coming soon."
4. **Destroyed player respawn** — Web client doesn't reload ship data after destruction, so respawn sector may be wrong visually.
5. **Combat doesn't remove dead NPC** — After winning combat, the NPC still appears in the sector list until you jump away.
6. **No mobile layout** — Sector view grid is unusable below ~768px.

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

**Fix ship stats in web client** — `web/game/src/stores/ship.ts` line ~30-40. Import `computeEffectiveStats` from `@tw3002/engine` and use it to set `maxCargo`, `maxHull`, `maxShield`, `maxTurns` after loading ship data. Then do the same after upgrade purchase in `StarDockView.vue`.

After that: implement `LeaderboardView.vue` (API already works) and `NavigationView.vue` (galaxy.visitedIds already tracked).

---

*See you in the black, Commander.* 🌌
