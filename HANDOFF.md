# TW 3002 AI — Session Handoff

Date: 2026-05-03
Version: CLI v0.6.0 | API v0.6.0 | Web Client v0.6.0
Repo: https://github.com/prillcode/tw-3002-ai

---

## Session Accomplishments

### ✅ TW-12: API Docs & Rate Limiting (All 3 Phases Complete)

**Phase 1 — Rate Limiting + Action Budget**
- In-memory rate limiting across 5 categories (42 endpoints):
  - Auth: 5/min per IP
  - Gameplay (POST): 10/min per playerId + action budget
  - Reads (auth GET): 60/min per playerId
  - Public reads: 60/min per IP
  - Admin: 10/min per IP
- Rate limit headers on every response: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- D1-backed action budget: 60 points, regenerates 1/min, cap 60
- 23 gameplay handlers check/deduct action points before executing
- Migration `0010_action_points.sql` applied to production D1

**Files:** `cloud/src/utils/rateLimit.ts`, `cloud/src/utils/actionBudget.ts`, `cloud/src/utils/cors.ts`, `cloud/src/index.ts`, `cloud/migrations/0010_action_points.sql`

**Phase 2 — Scalar API Reference + Markdown Docs**
- OpenAPI 3.1 spec (`public/openapi.yaml`) covering all 42 endpoints
- Scalar UI embedded at `playtradewars.net/api/reference/` (CDN-loaded, deepSpace theme)
- Markdown prose pages: introduction, getting-started, authentication, fair-play, tutorials (stats-dashboard, news-bot)
- Astro content collection `api` added
- Nav links added to site header and landing page

**Files:** `web/main/public/openapi.yaml`, `web/main/src/pages/api/reference.astro`, `web/main/src/pages/api/index.astro`, `web/main/src/pages/api/[...slug].astro`, `web/main/src/content/api/*.md`, `web/main/src/content/config.ts`, `web/main/src/components/TerminalHeader.vue`, `web/main/src/pages/index.astro`

**Phase 3 — Fair Play & Terms of Service**
- Fair Play page: rules, philosophy, what's encouraged vs not
- Terms of Service page: as-is service, 13+, data may be deleted, account suspension

**Files:** `web/main/src/content/api/fair-play.md`, `web/main/src/content/api/terms.md`

### ✅ TW-11: Email Verification + Anti-Spam (Phases 1 & 2 Complete)

**Phase 1 — Anti-Spam Foundation**
- Disposable email blocklist: 2,000 most common throwaway domains (generated from `disposable/disposable-email-domains`)
- Email format validation: regex + minimum domain length
- Cloudflare Turnstile invisible CAPTCHA on login form
- Server-side Turnstile token verification

**Phase 2 — Email Verification Flow**
- Complete rewrite of auth system:
  - `POST /api/auth/register` → creates unverified player, sends 6-digit OTP via email
  - `POST /api/auth/verify-email` → validates OTP, returns bearer token
  - `POST /api/auth/verify` → legacy endpoint, now requires `email_verified = 1`
- OTP: 6 digits, SHA-256 hashed, 15-minute expiry, 5-attempt limit
- Email via Resend (transactional) — dev fallback logs to console if no API key
- Ship creation blocked until email verified (403)
- Vue login flow: 3 steps — register → verify OTP → create ship
- Migration `0011_email_verification.sql` applied to production D1 (existing players grandfathered as verified)

**Secrets configured:**
- `TURNSTILE_SECRET_KEY` — Cloudflare Turnstile server-side secret
- `RESEND_API_KEY` — Resend transactional email API key
- Turnstile site key: `0x4AAAAAADIgFsuw7omMEkIh` (deployed in game client)

**Files:** `cloud/src/utils/email.ts`, `cloud/src/utils/disposable-domains.ts`, `cloud/src/routes/auth.ts`, `cloud/src/routes/player.ts`, `cloud/src/index.ts`, `cloud/migrations/0011_email_verification.sql`, `web/game/src/stores/auth.ts`, `web/game/src/views/LoginView.vue`, `web/main/src/content/api/authentication.md`

### ✅ Version Alignment
- API version bumped from 0.5.5 → 0.6.0 (matches web client)
- Reflected in `/health` endpoint and OpenAPI spec

---

## Currently Troubleshooting

### ✅ Fixed: Turnstile "Resend Code" Fails
**Fix:** Added `resetTurnstile()` helper that calls `window.turnstile.reset()` after each register/resend.
**Status:** ✅ Deployed.

### ✅ Fixed: Resend Emails
**Fix:** `playtradewars.net` domain verified in Resend, DNS auto-configured in Cloudflare. Sender set to `welcome@playtradewars.net`.
**Status:** ✅ Confirmed working — OTP emails arrive and verification succeeds end-to-end.

---

## Deployment State

| Component | Status | URL |
|---|---|---|
| API Worker | ✅ Deployed v0.6.5 | `https://tw3002-api.prilldev.workers.dev` |
| Astro Site (docs) | ✅ Deployed v0.6.5 | `https://playtradewars.net` |
| Game Client | ✅ Deployed v0.6.5 | `https://portal.playtradewars.net` |
| D1 Migrations | ✅ 0010 + 0011 + 0012 applied | `tw3002-galaxy` |

**Worker secrets configured:**
- `ADMIN_SECRET`
- `TURNSTILE_SECRET_KEY`
- `RESEND_API_KEY`

**Worker env vars:**
- `NPC_MODEL` = `@cf/zai-org/glm-4.7-flash`
- `NPC_QUOTE_MODEL` = `@cf/qwen/qwen3-30b-a3b-fp8`
- `NPC_LLM_ENABLED` = `true`

---

## In Progress

### ✅ TW-19: Leaderboards & Daily Bounties

**Phase 01 — Daily Bounty System: Server** ✅ COMPLETE & DEPLOYED
- D1 migration `0012_daily_missions.sql` applied to production
- `player_daily_missions` table + `visited_sectors_json` column on `player_ships`
- Mission generator: 3 missions/day, 5 types, no duplicates
- API endpoints live: GET missions, POST claim, POST reroll
- Progress hooks in 5 action endpoints (combat, trade, move, colonize, taxes)

**Phase 02 — Daily Bounty System: Web Client** ✅ COMPLETE & DEPLOYED
- `MissionPanel.vue` component with progress bars, claim/reroll buttons
- Integrated into `SectorView.vue` via modal system (`B` key)
- Toast notifications when missions complete during gameplay

**Phase 03 — Leaderboard Enhancements** ✅ COMPLETE & DEPLOYED
- 6 leaderboard tabs: Net Worth, Kills, Deaths, Planets, Experience, CHOAM Bounty
- Click any player → profile modal with full stats (standing, rank, planets, commission)
- API: `sort=planets` and `sort=experience` added to `/api/leaderboard`

**Files:** `cloud/migrations/0012_daily_missions.sql`, `cloud/src/utils/dailyMissions.ts`, `cloud/src/routes/missions.ts`, `cloud/src/routes/news.ts`, `cloud/src/routes/action.ts`, `cloud/src/routes/player.ts`, `cloud/src/routes/planets.ts`, `cloud/src/index.ts`, `web/game/src/components/MissionPanel.vue`, `web/game/src/components/PlayerProfileModal.vue`, `web/game/src/views/LeaderboardView.vue`, `web/game/src/views/SectorView.vue`

---

## Next Steps

### Immediate
1. **Update player guides** — see "How to Play Guide Gap Analysis" below
2. **Invite real players** — auth + daily missions + leaderboard = solid onboarding

### Short Term
3. **Skip TW-11 Phase 3** (subscriber management) — defer until player base justifies it

---

## Quick Resume Commands

```bash
cd /home/prill/dev/tw-3002-ai

# --- Cloud Worker ---
cd cloud
bun run typecheck      # validate TypeScript
bun run deploy         # deploy worker

# Check health + version
curl -s https://api.playtradewars.net/health
# → {"status":"ok","version":"0.6.0"}

# Check rate limit headers
curl -I https://api.playtradewars.net/health
# → X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset

# Test auth flow
curl -X POST https://api.playtradewars.net/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","turnstileToken":"..."}'

# --- Astro Site (docs) ---
cd web/main
bun run dev            # http://localhost:4321
bun run build && wrangler pages deploy dist --project-name tw-3002-ai

# --- Game Client ---
cd web/game
bun run dev            # http://localhost:5173
bun run build && wrangler pages deploy dist --project-name tw3002-game

# --- D1 Queries ---
cd cloud
npx wrangler d1 execute tw3002-galaxy --remote \
  --command "SELECT email, email_verified, created_at FROM players ORDER BY created_at DESC;"

npx wrangler d1 execute tw3002-galaxy --remote \
  --command "SELECT p.email, ps.ship_name, ps.credits, ps.current_sector FROM player_ships ps JOIN players p ON p.id = ps.player_id;"
```

---

## How to Play Guide Gap Analysis

**Existing guides** (`web/main/src/content/guide/`):
1. ✅ Getting Started — install, first game, ship classes
2. ✅ Trading — commodities, port classes, basic strategy
3. ✅ Combat — options, mechanics, death/respawn
4. ✅ StarDock & Upgrades — repairs, upgrade categories/tiers
5. ✅ Keyboard Reference — key bindings

**Missing guides** (critical for new players):

| Gap | Priority | Why |
|---|---|---|
| **Daily Bounties** | 🔴 High | New feature, completely undocumented. Players won't know `B` key or how missions work |
| **Planets & Colonization** | 🔴 High | Major feature (TW-14). Genesis torpedo, colonists, citadels, Q-cannons — none explained |
| **Fighters & Mines** | 🟡 Medium | Deploy/recall fighters, limpets, armids, blockades — in game but not in guides |
| **Alignment & Factions** | 🟡 Medium | CHOAM, Fremen, Sardaukar, Guild commissions — core to identity but unexplained |
| **Navigation & Sectors** | 🟡 Medium | Danger levels, FedSpace, connections, how the galaxy is structured |
| **Insurance** | 🟢 Low | Mentioned in combat guide but deserves its own section |
| **Leaderboard & Bounty Board** | 🟢 Low | Social features, wanted system — nice to document |
| **Cloud vs Local** | 🟢 Low | Clarify web client vs CLI differences |

**Recommendation:** Write 3 new guide pages before inviting players:
1. `guide/daily-bounties.md` — How missions work, types, rewards, rerolling
2. `guide/planets.md` — Genesis torpedo, colonization, citadels, production
3. `guide/fighters-mines.md` — Fighter deployment modes, mines, blockades

These cover the biggest "how do I...?" gaps a new player would face.

---

## Key Files Changed This Session

```
cloud/src/utils/rateLimit.ts                    (new)
cloud/src/utils/actionBudget.ts                 (new)
cloud/src/utils/email.ts                        (new)
cloud/src/utils/disposable-domains.ts           (new)
cloud/src/utils/cors.ts                         (modified)
cloud/src/routes/auth.ts                        (rewritten)
cloud/src/routes/player.ts                      (modified)
cloud/src/routes/news.ts                        (modified)
cloud/src/routes/action.ts                      (modified)
cloud/src/routes/combat.ts                      (modified)
cloud/src/routes/fighters.ts                    (modified)
cloud/src/routes/planets.ts                     (modified)
cloud/src/routes/mines.ts                       (modified)
cloud/src/index.ts                              (modified)
cloud/migrations/0010_action_points.sql         (new)
cloud/migrations/0011_email_verification.sql    (new)

web/main/public/openapi.yaml                    (new)
web/main/src/pages/api/reference.astro          (new)
web/main/src/pages/api/index.astro              (new)
web/main/src/pages/api/[...slug].astro          (new)
web/main/src/content/config.ts                  (modified)
web/main/src/content/api/*.md                   (new)
web/main/src/components/TerminalHeader.vue      (modified)
web/main/src/pages/index.astro                  (modified)

web/game/src/stores/auth.ts                     (rewritten)
web/game/src/views/LoginView.vue                (rewritten)

.planning/TW-12-api-docs-rate-limiting/*         (updated)
.planning/TW-11-email-player-polish/phases/*     (new)
.planning/TW-19-leaderboards-and-daily-bounties/*  (new)
cloud/migrations/0012_daily_missions.sql         (new)
cloud/src/utils/dailyMissions.ts                 (new)
cloud/src/routes/missions.ts                     (new)
cloud/src/routes/news.ts                         (modified)
web/game/src/components/MissionPanel.vue         (new)
web/game/src/components/PlayerProfileModal.vue   (new)
web/game/src/views/LeaderboardView.vue           (modified)
web/game/src/views/SectorView.vue                (modified)
web/game/src/views/LoginView.vue                 (modified)
web/main/public/openapi.yaml                     (modified)
web/main/src/pages/index.astro                   (modified)
web/main/src/pages/api/index.astro               (modified)
web/main/src/content/api/introduction.md         (modified)
web/main/src/content/api/getting-started.md      (modified)
```

---

*See you in the black, Commander.* 🌌
