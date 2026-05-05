# TW 3002 AI — Session Handoff

Date: 2026-05-04
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

## Session Accomplishments (2026-05-04)

### ✅ NPC Combat on Sector Entry
**Problem:** Warping into dangerous sectors never triggered combat. NPC raiders were visible in the sector view but required manual "⚔ Attack" clicks. The entry pipeline (`handleMoveShip`) had no `npc_encounter` step.

**Fix:**
- Added `getHostileNpcsInSector()` query to detect raider NPCs in destination sector
- Added NPC encounter step after ship-to-ship PvP in the entry pipeline
- Returns `npcEncounter: { npcs, encounterRequired: true }` when raiders present
- Client (`SectorView.vue`) auto-routes to `CombatView` on `npcEncounter` response
- Added `npc_encounter` to `OperationStep` union type (`fighters.ts`)

**Current NPC density:** 122 active NPCs across 1,000 sectors (914 dangerous):
- Raiders: 21 (Fremen) — only type that auto-attacks
- Patrols: 34 (CHOAM) — hunt Sardaukar NPCs only
- Merchants: 67 (CHOAM/Independent) — non-combat

**Operations panel now shows:**
```
nav_hazard     → skipped_not_implemented
limpet_mines   → skipped_no_hostiles
armid_mines    → skipped_no_hostiles
q_cannon       → skipped_no_hostiles
fighters       → skipped_no_hostiles
ship_to_ship   → no_op / resolved
npc_encounter  → awaiting_player_choice / skipped_no_hostiles  ← NEW
```

**Files:** `cloud/src/routes/player.ts`, `cloud/src/routes/fighters.ts`, `web/game/src/views/SectorView.vue`, `web/game/src/stores/ship.ts`

### ✅ Player Guides (3 New)
Wrote and deployed 3 critical guides before inviting players:

| Guide | Order | Coverage |
|-------|-------|----------|
| **Daily Bounties** | 6 | 3 missions/day, 5 types, difficulties, reroll costs, rewards, CHOAM leaderboard |
| **Planets & Colonization** | 7 | 7 classes, genesis torpedo, colonist transport, production curves, citadels, Q-cannons |
| **Fighters & Mines** | 8 | 3 deployment modes, tolled blockades, limpet/armid mines, blockade levels, insurance |

- Guide sidebar (`GuideLayout.astro`) now dynamically loads from content collection — no more hardcoded links
- Updated `getting-started.md` "What's Next" section to link to new guides

**Files:** `web/main/src/content/guide/daily-bounties.md`, `web/main/src/content/guide/planets.md`, `web/main/src/content/guide/fighters-mines.md`, `web/main/src/layouts/GuideLayout.astro`, `web/main/src/content/guide/getting-started.md`

### ✅ UI Polish
- **Moved "Ships in Sector" panel to top** — immediately below sector banner, before the 3-column grid
- Added red border (`border-terminal-red/30`) and red "⚠ Ships in Sector" header for threat visibility
- Fixed duplicate 3-column grid bug (removed stray first grid from template refactor)

**Files:** `web/game/src/views/SectorView.vue`

---

## Next Steps

### Immediate
1. **🎯 Spawn ~70 additional raider NPCs** — Combat density is too low for a solo/low-pop galaxy
   - **Current:** 21 raiders across 914 dangerous sectors = ~1 per 43 dangerous sectors
   - **Target:** ~90 raiders = ~1 per 10 dangerous sectors
   - **Why:** In TW2002, *every* dangerous sector had threat potential because players were everywhere. NPCs are our only substitute. At 1:10 density, a player encounters a fight roughly every 10 warps — tension stays alive without blocking trade/exploration.
   - **How:** Insert new raider rows into `npcs` table targeting empty dangerous sectors. Use existing `persona_json` templates from current Fremen raiders.
   - **Follow-up idea:** Make CHOAM patrols auto-attack players with negative alignment on entry. Gives evil path a real cost even without human enforcers.

2. **Invite real players** — auth + daily missions + leaderboard + guides + combat = solid onboarding

### Short Term
3. **Skip TW-11 Phase 3** (subscriber management) — defer until player base justifies it
4. **Medium-priority guides** (if player feedback demands it):
   - Alignment & Factions
   - Navigation & Sectors
   - Insurance

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

## CLI Deprecation

**2026-05-03:** CLI client deprecated from public-facing docs and website.

**Reason:** Web client is the canonical, feature-rich experience. CLI lacks email verification, daily missions, leaderboards, planets, fighters, mines, alignment system, and more. Advertising it as a first-class option confuses new players.

**Changes made:**
- `web/main/src/content/guide/getting-started.md` — Rewritten web-first (register → verify email → name ship → choose class)
- `web/main/src/pages/index.astro` — Replaced "Play Your Way" dual-platform section with web-focused flow
- `web/main/src/content/guide/keyboard.md` — Added deprecation note (legacy CLI reference)

**CLI source code preserved** in `cli/` directory for historical reference and potential future revival.

**Remaining CLI cleanup for future sessions:**
- `README.md` ✅ Updated (just done)
- `GAME_GUIDE.md` (root) — Still CLI-centric, lists cloud multiplayer as "coming soon". Consider adding a deprecation banner at top, or redirecting to `playtradewars.net/guide`
- `cli/README.md` — Fine to leave as-is (it's the CLI's own docs)
- `GAMEPLAY_SCREENSHOTS.md` — CLI screenshots, fine as historical record
- Root `package.json` — if `tw3002-ai` npm package is published, consider adding deprecation notice
- `TerminalHeader.vue` component name — harmless, but references "terminal age" branding. Could rename to `SiteHeader.vue` if desired (cosmetic only)

---

## Planet Seeding

**2026-05-03:** Seeded 10 unclaimed starter planets into production galaxy (The Void — 1000 sectors):

| Sector | Planet | Class |
|---|---|---|
| 152 | Merak Colony | M (Earth Type) |
| 165 | Altair Wastes | K (Desert) |
| 233 | Mira Deep | O (Oceanic) |
| 240 | Lyra Spire | L (Mountainous) |
| 283 | Castor Frost | C (Glacial) |
| 319 | Sirius Caldera | H (Volcanic) |
| 396 | Mira Garden | M (Earth Type) |
| 451 | Polaris Dunes | K (Desert) |
| 545 | Castor Abyss | O (Oceanic) |
| 767 | Antares Crag | L (Mountainous) |

All unclaimed (`owner_id = 0`), zero colonists, citadel level 0. Documentation: `.planning/TW-14-planets-citadels/phases/PLANET-SEED.md`

---

## How to Play Guide Status

**All critical guides complete.** 8 guides live at `playtradewars.net/guide/*`.

| # | Guide | Status | Order |
|---|-------|--------|-------|
| 1 | Getting Started | ✅ | 1 |
| 2 | Trading | ✅ | 2 |
| 3 | Combat | ✅ | 3 |
| 4 | StarDock & Upgrades | ✅ | 4 |
| 5 | Keyboard Reference | ✅ | 5 |
| 6 | Daily Bounties | ✅ **New** | 6 |
| 7 | Planets & Colonization | ✅ **New** | 7 |
| 8 | Fighters & Mines | ✅ **New** | 8 |

**Sidebar:** Dynamically generated from `guide` content collection (`GuideLayout.astro` updated 2026-05-04).

**Remaining gaps** (medium/low priority — add if player feedback demands):
- Alignment & Factions
- Navigation & Sectors  
- Insurance (currently covered in Fighters & Mines and Combat guides)

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
web/main/src/content/guide/daily-bounties.md     (new)
web/main/src/content/guide/planets.md            (new)
web/main/src/content/guide/fighters-mines.md     (new)
web/main/src/content/guide/getting-started.md    (modified)
web/main/src/layouts/GuideLayout.astro           (modified)
```

---

*See you in the black, Commander.* 🌌
