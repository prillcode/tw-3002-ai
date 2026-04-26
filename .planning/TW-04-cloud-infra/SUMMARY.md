# TW-04: Cloud Infrastructure & Distribution — Summary

## Status: 🟡 Partially Complete (Core Done, Distribution Deferred)

**Date:** 2026-04-25
**Version:** API v0.5.5 | Web Client v0.5.5

---

## What Was Accomplished

### ✅ Phase 1: Cloudflare Setup
- Cloudflare Worker project `tw3002-api` deployed
- D1 database `tw3002-galaxy` created and migrated
- `wrangler.toml` configured with bindings, secrets, environment variables
- Local dev via `wrangler dev` working
- Production deploy via `wrangler deploy` working
- Custom domain: `api.playtradewars.net`

### ✅ Phase 2: D1 Schema & Migrations
- `cloud/migrations/0001_init.sql` — galaxies, sectors, players, ships, NPCs, news, pvp_kills
- `cloud/migrations/0002_stardocks.sql` — StarDock sectors (13, 250, 500, 750)
- `cloud/migrations/0003_pvp_infra.sql` — reputation, insurance_expires, indexes
- D1 migrations applied successfully via `wrangler d1 execute --remote`

### ✅ Phase 3: Workers API
All REST endpoints operational:
- `POST /api/auth/register` — email-based registration
- `GET /api/player` — player profile
- `GET /api/player/ship` — ship state with turn regeneration
- `POST /api/player/ship` — create/join galaxy
- `POST /api/player/ship/move` — sector movement
- `POST /api/action/trade` — buy/sell commodities
- `POST /api/action/combat` — NPC combat with narrative
- `POST /api/action/upgrade` — StarDock upgrades
- `GET /api/galaxy/:id/sectors` — galaxy topology
- `GET /api/galaxy/:id/sector` — sector detail (NPCs, inventory)
- `GET /api/leaderboard` — ranked player stats
- `GET /api/news` — galaxy news ticker
- `POST /api/npc/tick` — admin NPC cron trigger
- `GET /api/player/stats` — PvP stats (TW-05)
- `GET /api/bounty/board` — wanted players (TW-05)
- `GET /api/bounty/status` — own wanted status (TW-05)
- `GET /api/notifications/digest` — offline summary (TW-05)
- `POST /api/insurance/buy` — ship insurance (TW-05)
- `GET /api/insurance/status` — insurance check (TW-05)

Plus CORS configured for `portal.playtradewars.net`, `playtradewars.net`, and localhost.

### ⚠️ Phase 4: Email Authentication
- **Done:** Register endpoint generates UUID token, stores in D1, returns directly
- **Deferred:** No SMTP integration yet — no magic links sent via email. Token acts as bearer credential returned in JSON.
- **Rationale:** For MVP, email = persistent identifier + subscriber list. SMTP integration planned in TW-11.

### ❌ Phase 5: Admin Panel
- Not built. Admin actions (NPC tick, galaxy config) require `ADMIN_SECRET` header.
- **Deferred to:** TW-12 or manual wrangler/DB management.

### ✅ Phase 6: Web Client
- **Vue 3 + Pinia + Vue Router** SPA built in `web/game/`
- Hosted on Cloudflare Pages at `https://portal.playtradewars.net`
- Full feature parity with CLI cloud mode: sector view, warp, trade, combat, upgrades, leaderboard, navigation, help
- Responsive design (works on mobile)
- Astro docs site at `https://playtradewars.net`

### ⚠️ Phase 7: CLI Distribution
- **Done:** GitHub Actions workflow (`.github/workflows/release.yml`) builds binaries for Linux, macOS, Windows on tag push
- **Deferred:** Not published to npm or Homebrew yet. Users download from GitHub Releases.

### ❌ Phase 8: Docker & Home Hosting
- No Dockerfile or docker-compose.yml
- **Deferred:** Local SQLite mode (TW-01) still works for offline play. Docker planned for TW-12 or later.

### ⚠️ Phase 9: CI/CD & Monitoring
- **Done:** Cloudflare Pages auto-deploys on push. GitHub Actions builds CLI binaries.
- **Deferred:** No automated Worker deployment via Actions. No cost monitoring dashboard. No error tracking (Sentry).

---

## What's Missing & Why

| Item | Status | Reason |
|------|--------|--------|
| Magic link emails | Deferred | No SMTP provider set up; token returned directly |
| Admin panel web UI | Deferred | Admin secret header sufficient for now |
| npm publish | Deferred | GitHub Releases sufficient for beta |
| Homebrew formula | Deferred | Same — GitHub Releases |
| Docker | Deferred | Local SQLite mode works; cloud is primary target |
| Auto Worker deploy via Actions | Deferred | Manual `wrangler deploy` is fast enough |
| Cost monitoring | Deferred | Hobby scale, costs negligible so far |

---

## Architecture Decisions Made

1. **D1 over SQLite for cloud** — D1 is the source of truth for shared galaxies. Local SQLite (TW-01) is single-player only.
2. **Email-as-username auth** — No passwords. Token returned directly (SMTP deferred to TW-11).
3. **Pages root directory strategy** — `web/main` and `web/game` deploy separately with their own build configs.
4. **CORS at top level** — `applyCors()` wraps all responses with origin allowlist.
5. **No WebSockets** — REST polling sufficient for turn-based gameplay.

---

## Files

- `cloud/src/index.ts` — Worker router
- `cloud/src/routes/*.ts` — API route handlers
- `cloud/migrations/*.sql` — D1 schema
- `cloud/wrangler.toml` — Worker config
- `web/game/` — Vue SPA client
- `web/main/` — Astro docs site
- `.github/workflows/release.yml` — CLI binary builds

---

## Next Steps for Remaining TW-04 Items

- **SMTP + magic links** → TW-11 (Email & Player Polish)
- **Admin panel** → TW-12 (API Docs & Rate Limiting) or a new admin work item
- **npm publish / Homebrew** → Post-beta, after TW-06 combat is proven
- **Docker** → Post-beta, for self-hosting enthusiasts
- **CI/CD auto-deploy** → Nice-to-have; manual deploy is fine for now
