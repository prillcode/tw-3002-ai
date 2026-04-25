# TW-10 — Web Client & Marketing Site Roadmap

## Phase 01 — Astro Docs Site Scaffold
Scaffold the Astro marketing/docs site at `web/main/`, migrate `GAME_GUIDE.md` content, and deploy to `playtradewars.net`.

- [ ] 01-01: Create Astro project with Vue integration and Tailwind
- [ ] 01-02: Set up content collections for game guide
- [ ] 01-03: Migrate GAME_GUIDE.md to Astro markdown pages
- [ ] 01-04: Build landing page with terminal aesthetic
- [ ] 01-05: Add interactive Vue components (leaderboard widget, ship stats demo)
- [ ] 01-06: Deploy to Cloudflare Pages at `playtradewars.net`

## Phase 02 — Vue Game Client Scaffold
Scaffold the Vue 3 SPA at `web/game/` with Pinia, Vue Router, and the shared design system.

- [ ] 02-01: Create Vue 3 project with Vite, Pinia, Vue Router, Tailwind
- [ ] 02-02: Set up API client layer (port from `cli/src/cloud/client.ts`)
- [ ] 02-03: Create Pinia stores: auth, galaxy, ship, ui
- [ ] 02-04: Build auth flow (register → verify → ship creation)
- [ ] 02-05: Build sector view with navigation
- [ ] 02-06: Deploy to Cloudflare Pages at `portal.playtradewars.net`

## Phase 03 — Cloud API CORS & Domain Config
Update the Cloudflare Worker to serve the new web origins.

- [ ] 03-01: Update CORS allowlist for `playtradewars.net` and `portal.playtradewars.net`
- [ ] 03-02: Add custom domain `api.playtradewars.net` to Worker
- [ ] 03-03: Test end-to-end: web client → API → D1

## Phase 04 — Feature Parity (Web Client)
Add remaining cloud-mode features to the web client.

- [ ] 04-01: Market/trade overlay
- [ ] 04-02: Combat screen with narrative
- [ ] 04-03: StarDock upgrades
- [ ] 04-04: Navigation log
- [ ] 04-05: Help screen
- [ ] 04-06: Leaderboard screen
