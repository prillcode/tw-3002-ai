# TW-04 Roadmap: Cloud Infrastructure & Distribution

**Estimated Total:** 46-65 hours (6-8 focused sessions)

## Phase 1: Cloudflare Setup (2-3 hours)
**Goal:** Account and project scaffolding

**Deliverables:**
- [ ] Cloudflare account creation
- [ ] Workers project: `tw3002-api`
- [ ] D1 database creation: `tw3002-galaxy`
- [ ] `wrangler.toml` configuration
- [ ] Local dev: `wrangler dev` working
- [ ] Deploy test: `wrangler deploy` working
- [ ] Environment variables (secrets management)

**Success:** Can deploy a hello-world Worker and query D1 locally.

---

## Phase 2: D1 Schema & Migration (4-6 hours)
**Goal:** SQLite → D1 compatible schema

**Deliverables:**
- [ ] `db/migrations/` with D1-compatible SQL
- [ ] `drizzle-orm` or raw SQL client
- [ ] Migration system (apply/rollback)
- [ ] Schema parity with local SQLite (TW-01)
- [ ] Indexes for query performance
- [ ] Seeding: test galaxy data

**Success:** Can migrate TW-01 local SQLite to D1 without data loss.

---

## Phase 3: Workers API (8-12 hours)
**Goal:** REST API for game operations

**Deliverables:**
- [ ] `src/routes/auth.ts` — email token endpoints
- [ ] `src/routes/player.ts` — login, logout, state
- [ ] `src/routes/galaxy.ts` — sector data, NPC positions
- [ ] `src/routes/action.ts` — move, trade, combat
- [ ] `src/routes/admin.ts` — galaxy config, reset
- [ ] CORS setup (for web client)
- [ ] Rate limiting (per IP, per user)
- [ ] Error handling and logging

**Success:** CLI can connect and play via API instead of local SQLite.

---

## Phase 4: Email Authentication (6-8 hours)
**Goal:** Magic link login system

**Deliverables:**
- [ ] Email service (Resend/Postmark/Cloudflare Email)
- [ ] Token generation (secure, expiring)
- [ ] `POST /auth/login` — request magic link
- [ ] `GET /auth/verify` — validate token, set session
- [ ] Session management (JWT or cookie)
- [ ] CLI login flow: `tw3002 login` → open browser → paste token
- [ ] Email opt-in (community building)

**Success:** Player can register and login without passwords.

---

## Phase 5: Admin Panel (6-8 hours)
**Goal:** Web interface for galaxy management

**Deliverables:**
- [ ] `admin/` Svelte/Vanilla JS app
- [ ] Protected by admin auth
- [ ] Galaxy list view (active, player count)
- [ ] Galaxy config: reset schedule, LLM model choice
- [ ] Player list (email, net worth, last login)
- [ ] Reset trigger (manual galaxy wipe)
- [ ] Voting system UI (for player reset votes)
- [ ] Cost dashboard (LLM usage, request counts)

**Success:** Admin can manage galaxies without code changes.

---

## Phase 6: Web Client (7-10 hours)
**Goal:** Browser-based fallback

**Deliverables:**
- [ ] `web/` Svelte app
- [ ] Same API as CLI
- [ ] Simplified sector view (HTML, not ANSI)
- [ ] Trading interface (forms, not TUI)
- [ ] Responsive design (mobile ok)
- [ ] Hosted on Cloudflare Pages
- [ ] "Get the CLI" call-to-action

**Success:** Can play in browser, but CLI is clearly superior.

---

## Phase 7: CLI Distribution (5-7 hours)
**Goal:** Easy installation

**Deliverables:**
- [ ] `package.json` bin entry: `tw3002`
- [ ] npm publish (scoped or public)
- [ ] Homebrew formula (tap setup)
- [ ] Binary compilation: `bun build --compile`
- [ ] GitHub Releases with binaries
- [ ] Installation docs
- [ ] Auto-update check

**Success:** `npm install -g tw3002` works globally.

---

## Phase 8: Docker & Home Hosting (4-5 hours)
**Goal:** Private galaxy option

**Deliverables:**
- [ ] `Dockerfile` (Bun runtime)
- [ ] `docker-compose.yml` with SQLite volume
- [ ] Environment config (LLM key, port)
- [ ] Local server mode (skip Workers)
- [ ] Cloudflare Tunnel docs (for public sharing)
- [ ] README: self-hosting guide

**Success:** `docker run` spins up private galaxy.

---

## Phase 9: CI/CD & Monitoring (4-6 hours)
**Goal:** Automated deployment, cost safety

**Deliverables:**
- [ ] GitHub Actions: test, build, deploy Workers
- [ ] GitHub Actions: publish npm on release
- [ ] Cost alerts (LLM spend, D1 writes)
- [ ] Error tracking (Sentry or Cloudflare)
- [ ] Analytics (optional, privacy-respecting)
- [ ] Status page (is galaxy online?)

**Success:** Push to main deploys; costs monitored; errors tracked.

---

## Phase Completion Order
1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9

Phases 1-6 are core infrastructure. Phases 7-9 are distribution and operations.

---

## Definition of Done
- All 9 phases complete
- Public galaxy hosted at galaxy3002.pages.dev
- Players can: install CLI, register email, join shared galaxy
- Admin can: manage resets, monitor costs
- Home Docker works for private play
- CI/CD automated, monitoring in place
- Project is "shipped" and playable

---

## Launch Readiness Checklist
- [ ] 100+ sector galaxy running
- [ ] 20+ NPCs active, costs under control
- [ ] 10+ beta testers playing for a week
- [ ] No critical bugs, no data loss
- [ ] Documentation complete
- [ ] Announcement ready (Reddit, HN, Discord)
