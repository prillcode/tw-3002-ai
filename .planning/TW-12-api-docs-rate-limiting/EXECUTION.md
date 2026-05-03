# TW-12 Execution Plan

**Updated:** 2026-05-03 — refreshed endpoint inventory (42 endpoints, up from ~22) and added Scalar API Reference as primary docs UI.

## Phase 1: Rate Limiting (Cloudflare Worker)
**Goal:** Prevent speed-based bot advantages

1. Create `cloud/src/utils/rateLimit.ts` — in-memory rate limiting
2. Create `cloud/src/utils/actionBudget.ts` — D1-backed action budget
3. Wire into `cloud/src/index.ts` for all 42 endpoints:
   - Auth: 5/min per IP
   - Gameplay (all POST actions): 10/min per playerId + action budget
   - Reads (auth GET): 60/min per playerId
   - Public reads: 60/min per IP
   - Admin: 10/min per IP + secret
4. Migration `0010_action_points.sql` — add `action_points` + `action_points_refill_at` to `player_ships`
5. Return 429 with `Retry-After` on rate limit; 403 on insufficient action points
6. Add `X-RateLimit-*` headers to all responses
7. Deploy and verify

## Phase 2: API Docs — Scalar + Markdown
**Goal:** Interactive API reference + narrative docs

1. Install `@scalar/api-reference` in `web/main/`
2. Create `web/main/src/data/openapi.yaml` — OpenAPI 3.1 spec covering all 42 endpoints
3. Create `web/main/src/pages/api/reference.astro` — Scalar UI page
4. Minimal markdown prose pages (overview, getting-started, auth, tutorials)
5. Navigation links

## Phase 3: Fair Play & Terms
**Goal:** Set expectations about automated play

1. Write `web/main/src/pages/api/fair-play.md`
2. Optional: Terms of Service stub
3. Link from API overview and tutorials

## Order
Phase 1 → Phase 2 → Phase 3

(Phase 3 is content-only; can overlap with Phase 2 if desired.)

## Notes
- Action budget is the real anti-bot mechanism, not rate limits
- Scalar eliminates the need for manual endpoint reference pages — the OpenAPI spec is the source of truth
- Keep OpenAPI spec in sync with API; add CI linting
