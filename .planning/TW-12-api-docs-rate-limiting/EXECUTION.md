# TW-12 Execution Plan

## Phase 1: Rate Limiting (Cloudflare Worker)
**Goal:** Prevent speed-based bot advantages

1. Add rate limit maps to `cloud/src/index.ts`:
   - Auth: 5/min per IP
   - Gameplay (trade/combat/move/upgrade): 10/min per player ID
   - Galaxy reads: 60/min per player ID
   - Public (leaderboard/news): 30/min per IP
2. Return 429 with `Retry-After` header when exceeded
3. Add `X-RateLimit-*` headers to responses
4. Add `action_points` to `player_ships` (regenerates 1/min, cap 60)
5. Deduct points on gameplay actions; return 403 if insufficient
6. Deploy and verify

## Phase 2: API Docs Content Collection
**Goal:** Document every endpoint on the Astro site

1. Add `api` content collection in `web/main/src/content/config.ts`
2. Create `ApiLayout.astro` (terminal theme, sidebar nav)
3. Write pages:
   - `api/index.md` — Overview, base URL, philosophy
   - `api/getting-started.md` — curl examples, auth flow
   - `api/authentication.md` — register, verify, bearer tokens
   - `api/reference/galaxy.md` — GET endpoints
   - `api/reference/player.md` — ship, move, stats
   - `api/reference/actions.md` — trade, combat, upgrade
   - `api/reference/news.md` — news, leaderboard
   - `api/tutorials/stats-dashboard.md` — read-only dashboard
   - `api/tutorials/news-bot.md` — Discord webhook tutorial
4. Add `/api/` link to main nav in `Layout.astro`

## Phase 3: Fair Play & Terms
**Goal:** Set expectations about automated play

1. Write `web/main/src/pages/api/fair-play.md`
2. Content: rate limits exist, action budgets exist, what custom clients are OK
3. Link from API overview page

## Order
Phase 1 → Phase 2 → Phase 3

## Notes
- Keep docs honest — the API is public, hiding it doesn't help
- Action budget is the real anti-bot mechanism, not rate limits
- Tutorials should be read-only tools, not gameplay automation
