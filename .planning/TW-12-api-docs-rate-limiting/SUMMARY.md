# TW-12 Summary: API Docs & Rate Limiting

**Status:** ✅ Phase 1 & 2 Complete

**Date:** 2026-05-03

---

## Overview

Implemented complete rate limiting and action budget enforcement on the Cloudflare Worker (42 endpoints), plus a public API documentation site with an interactive Scalar UI.

---

## Phase 1: Rate Limiting & Action Budget ✅

### Delivered

**In-memory rate limiting** across 5 categories:

| Category | Endpoints | Limit | Key |
|----------|-----------|-------|-----|
| Auth | `POST /api/auth/*` | 5/min | IP |
| Gameplay (all POST actions) | 23 endpoints | 10/min | playerId |
| Reads (auth GET) | 13 endpoints | 60/min | playerId |
| Public reads | 12 endpoints | 60/min | IP |
| Admin/NPC | 3 endpoints | 10/min | IP + secret |

**Rate limit headers** on every response:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

**429 response** with `Retry-After` header when exceeded.

**D1-backed action budget** (per player, per galaxy):
- 60 action points, cap 60
- Regenerates 1 point per minute
- 23 gameplay handlers check and deduct before executing
- 403 response with `X-ActionPoints-Remaining` and `X-ActionPoints-NextRefill` when insufficient

**Migration `0010_action_points.sql`** — added `action_points` and `action_points_refill_at` columns to `player_ships`. Seeded existing players to 60 points.

**Files:**
- `cloud/src/utils/rateLimit.ts` — in-memory rate limiter with sliding window
- `cloud/src/utils/actionBudget.ts` — D1 action point checker/deductor
- `cloud/src/utils/cors.ts` — `rateLimitedResponse()`, `actionBudgetExceededResponse()`, `addRateLimitHeaders()`
- `cloud/src/index.ts` — rate limiting wired into all 42 endpoints
- `cloud/migrations/0010_action_points.sql` — schema change + seed
- `cloud/src/routes/news.ts` — action budget in `handleAddNews`
- `cloud/src/routes/player.ts` — action budget in create ship, move, pay taxes, commission
- `cloud/src/routes/action.ts` — action budget in trade, combat, rob, steal, upgrade
- `cloud/src/routes/combat.ts` — action budget in insurance buy
- `cloud/src/routes/fighters.ts` — action budget in buy, deploy, recall, encounter resolve
- `cloud/src/routes/planets.ts` — action budget in create, colonize, citadel advance, qcannon, transport
- `cloud/src/routes/mines.ts` — action budget in buy, deploy, clear limpets

---

## Phase 2: API Documentation & Scalar UI ✅

### Delivered

**OpenAPI 3.1 spec** (`web/main/public/openapi.yaml`) covering all 42 endpoints:
- Path definitions with parameters, request bodies, response schemas
- Security schemes (bearer auth, admin secret)
- Reusable response components (401, 403, 429, 404)
- Rate limit and action budget documented in info description

**Scalar API Reference UI** at `playtradewars.net/api/reference/`:
- Loaded via CDN (`@scalar/api-reference`)
- `deepSpace` theme matching terminal aesthetic
- Interactive endpoint browser grouped by tags
- Try-it-out for public endpoints; auth config for authenticated ones

**Markdown prose pages** (Astro content collection):
- `/api/` — landing page with cards, base URL, rate limit table
- `/api/getting-started/` — first request, response format, status codes, headers
- `/api/authentication/` — register, verify, bearer token flow
- `/api/fair-play/` — rules, philosophy, what's encouraged vs not
- `/api/tutorials/stats-dashboard/` — read-only dashboard tutorial
- `/api/tutorials/news-bot/` — Discord webhook bot tutorial

**Navigation updates:**
- "API Docs" link added to `TerminalHeader.vue`
- "API Docs" button added to landing page hero

**Files:**
- `web/main/public/openapi.yaml`
- `web/main/src/pages/api/reference.astro`
- `web/main/src/pages/api/index.astro`
- `web/main/src/pages/api/[...slug].astro`
- `web/main/src/content/config.ts` — added `api` collection
- `web/main/src/content/api/introduction.md`
- `web/main/src/content/api/getting-started.md`
- `web/main/src/content/api/authentication.md`
- `web/main/src/content/api/fair-play.md`
- `web/main/src/content/api/tutorials/stats-dashboard.md`
- `web/main/src/content/api/tutorials/news-bot.md`
- `web/main/src/components/TerminalHeader.vue`
- `web/main/src/pages/index.astro`

---

## Architecture Decisions

1. **Scalar over manual markdown reference** — OpenAPI spec is the single source of truth; Scalar auto-generates the UI. Markdown reserved for prose (tutorials, philosophy).
2. **In-memory rate limits** — Acceptable for short (1-min) windows on Cloudflare Workers. D1-backed action budget provides the real anti-bot mechanism.
3. **Rate limit before action budget** — Rate limits catch speed abuse; action budget catches volume abuse. Different failure modes (429 vs 403).
4. **Action budget inside handlers** — Each handler calls `checkAndDeductActionPoints` after parsing the body, so galaxyId is available. Keeps index.ts clean.
5. **Version aligned** — API version bumped to 0.6.0 to match the web client.

---

## Deployment Notes

- Migration `0010` applied to production D1 after fixing wrangler migration tracking (inserted missing `d1_migrations` records for 0003-0009)
- Worker deployed to `tw3002-api.prilldev.workers.dev`
- Astro site deployed to Cloudflare Pages (`tw-3002-ai` project)

---

## Verification

### Rate Limiting
```bash
# Check headers on public endpoint
curl -I https://api.playtradewars.net/health
# Expect: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset

# Check version bumped
curl -s https://api.playtradewars.net/health
# Expect: {"status":"ok","version":"0.6.0"}
```

### Scalar UI
Open `https://playtradewars.net/api/reference/` in a browser. Browse endpoints, expand parameters, see response schemas.

### Astro Docs
- `https://playtradewars.net/api/` — landing page
- `https://playtradewars.net/api/getting-started/` — getting started
- `https://playtradewars.net/api/authentication/` — auth flow
- `https://playtradewars.net/api/fair-play/` — fair play policy
- `https://playtradewars.net/api/tutorials/stats-dashboard/` — dashboard tutorial
- `https://playtradewars.net/api/tutorials/news-bot/` — news bot tutorial

---

## How to Run Locally

### Scalar UI + Astro docs
```bash
cd web/main
npm run dev        # or: bun run dev
# Open http://localhost:4321/api/reference/
# Open http://localhost:4321/api/
```

The Scalar component loads from CDN and fetches `/openapi.yaml` relative to the site root. In dev mode this works because the YAML file is served from `public/`.

### API (with rate limiting)
```bash
cd cloud
npm run dev        # or: bun run dev
# Worker runs on http://localhost:8787
# Test: curl -I http://localhost:8787/health
```

---

## Unblocks

- TW-13+ can rely on rate limiting and action budget as baseline anti-abuse
- Phase 3 (Fair Play & ToS) content is already written in `fair-play.md` — just needs a dedicated ToS page if desired later
