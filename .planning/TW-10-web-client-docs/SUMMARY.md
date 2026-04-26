# TW-10: Web Client & Marketing Site — Summary

## Status: ✅ Complete

**Date:** 2026-04-24 through 2026-04-25 (multiple sessions)

---

## Overview

Built the entire web presence for TW 3002 AI: an Astro marketing/docs site and a Vue 3 SPA game client, both deployed to Cloudflare Pages with custom domains.

---

## Phase 1: Astro Docs Site ✅

**Delivered:**
- Astro project at `web/main/` with `@astrojs/vue` integration and Tailwind
- Content collections for game guide (getting-started, trading, combat, stardock, keyboard)
- Landing page with space terminal aesthetic at `playtradewars.net`
- `GuideLayout.astro` with sidebar navigation
- Migrated content from `GAME_GUIDE.md`

**Files:** `web/main/src/pages/`, `web/main/src/content/guide/`, `web/main/src/layouts/GuideLayout.astro`

---

## Phase 2: Vue Game Client Scaffold ✅

**Delivered:**
- Vue 3 + Pinia + Vue Router SPA at `web/game/`
- Stores: `auth.ts`, `galaxy.ts`, `ship.ts`, `ui.ts`
- Auth flow: register → ship creation → sector view
- Deployed to `portal.playtradewars.net`

**Files:** `web/game/src/stores/`, `web/game/src/router.ts`, `web/game/src/views/`

---

## Phase 3: CORS & Domain Config ✅

**Delivered:**
- CORS allowlist: `playtradewars.net`, `portal.playtradewars.net`, localhost
- Custom domain `api.playtradewars.net` on Worker
- End-to-end tested: web client → API → D1

**Files:** `cloud/src/utils/cors.ts`, `cloud/wrangler.toml`

---

## Phase 4: Feature Parity ✅

**Delivered:**
- MarketView — trade overlay with buy/sell and live prices
- CombatView — NPC combat with narrative display
- StarDockView — ship upgrades + insurance purchase
- NavigationView — sector visit history
- LeaderboardView — tabbed rankings (Net Worth / Kills / Deaths / Wanted)
- SectorView — warp lanes, NPC list, news ticker, danger indicators, ship status
- WarpOverlay — 800ms CSS warp jump animation

**Files:** `web/game/src/views/*.vue`, `web/game/src/components/WarpOverlay.vue`

---

## Architecture Decisions

1. **Two separate Pages projects** — `web/main` and `web/game` deploy independently
2. **No WebSockets** — REST polling sufficient for turn-based gameplay
3. **Shared design system** — Both sites use Tailwind with cyan/magenta/yellow accents
4. **Pinia over Vuex** — Simpler API, better TypeScript support

---

## Notes

- Web client became the primary product during development (CLI stays at current feature level)
- TW-05 PvP infrastructure (leaderboards, insurance, digest) was added to the web client after initial scaffold
- Mobile-responsive design works but isn't optimized — future polish item
