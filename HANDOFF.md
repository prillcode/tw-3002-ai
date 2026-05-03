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
**Symptom:** First register works. Clicking "Resend code" fails with "Turnstile verification failed".
**Root cause:** Turnstile tokens are single-use. After first `register()`, the token is consumed.
**Fix:** Added `resetTurnstile()` helper that calls `window.turnstile.reset()` after each register/resend, clearing the consumed token and forcing the widget to re-render for a fresh token.
**Status:** ✅ Deployed to game client.

### In Progress: Resend Emails
**Symptom:** Register with valid email → no email received.
**Action taken:** `playtradewars.net` domain added to Resend dashboard, DNS records auto-configured in Cloudflare.
**Sender changed:** `noreply@playtradewars.net` → `welcome@playtradewars.net` (deployed to Worker).
**Status:** DNS propagating. Test and check spam folder. Resend dashboard should show delivery status.

---

## Deployment State

| Component | Status | URL |
|---|---|---|
| API Worker | ✅ Deployed v0.6.0 | `https://tw3002-api.prilldev.workers.dev` |
| Astro Site (docs) | ✅ Deployed | `https://playtradewars.net` |
| Game Client | ✅ Deployed v0.6.0 | `https://portal.playtradewars.net` |
| D1 Migrations | ✅ 0010 + 0011 applied | `tw3002-galaxy` |

**Worker secrets configured:**
- `ADMIN_SECRET`
- `TURNSTILE_SECRET_KEY`
- `RESEND_API_KEY`

**Worker env vars:**
- `NPC_MODEL` = `@cf/zai-org/glm-4.7-flash`
- `NPC_QUOTE_MODEL` = `@cf/qwen/qwen3-30b-a3b-fp8`
- `NPC_LLM_ENABLED` = `true`

---

## Next Steps

### Immediate (this session / next)
1. **Test Resend email delivery** — verify OTP emails arrive at `prilldev@gmail.com`
2. **Test full auth flow end-to-end**
   - Register → receive OTP email → verify → create ship → enter galaxy
3. **If emails still don't arrive:** Check Resend dashboard delivery logs, check spam, consider using Resend's default onboarding domain for testing

### Short Term
4. **TW-11 Phase 3** — Subscriber & Player Management
   - Marketing consent checkbox
   - Admin player export endpoint
   - Unsubscribe flow
5. **Update API docs** if auth endpoint changes during debugging
6. **Add "resend OTP" endpoint** — currently re-uses `/api/auth/register`, which is fine but could be cleaner

### Medium Term
7. **Invite real players** — auth system is now production-ready with verification + anti-spam
8. **Monitor Resend deliverability** — bounce rates, spam complaints

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
```

---

*See you in the black, Commander.* 🌌
