# Cloud Agent Context

Rules, patterns, and gotchas for working on the TW 3002 AI Cloud API (Cloudflare Worker + D1).

---

## Architecture

- **Runtime:** Cloudflare Worker (TypeScript, Wrangler v4)
- **Database:** Cloudflare D1 (SQLite) with native `wrangler d1 migrations`
- **AI Integration:** OpenRouter via `OPENROUTER_API_KEY` secret — model set in `wrangler.toml` as `NPC_MODEL`
- **Auth:** Simple opaque Bearer tokens stored in D1, valid for 7 days
- **CORS:** Open cross-origin — intended for web client and CLI access

The engine (`@tw3002/engine`) **cannot be imported by the Worker** — it uses Node.js APIs (`process`) that don't exist in the Workers runtime. All game data generation happens in **Bun seed scripts** that produce SQL, which is then executed against D1.

---

## File Organization

| Directory | Purpose |
|-----------|---------|
| `src/routes/` | API route handlers by domain (auth, galaxy, player, action, news) |
| `src/utils/` | CORS headers, auth token verification |
| `migrations/` | D1 `.sql` files applied via `wrangler d1 migrations apply` |
| `scripts/` | Bun seed scripts that generate SQL for galaxy/NPC population |

---

## D1 Schema

One migration file: `migrations/0001_init.sql` creates all tables:

| Table | Purpose |
|-------|---------|
| `galaxies` | Shared game worlds |
| `sectors` | Galaxy nodes with ports, trade inventories, connections |
| `players` | Email-based auth with opaque tokens |
| `player_ships` | One ship per player per galaxy; tracks stats, upgrades, kills/deaths |
| `npcs` | Shared AI-driven NPCs with personas, ships, credits, memory |
| `news` | Galaxy event log |
| `pvp_kills` | Player vs player combat records |

Key design: **normalized schema** — unlike the local SQLite denormalized `saves` table, D1 separates players, ships, sectors, and NPCs.

---

## API Route Conventions

- **Public routes** (no auth): `/health`, `/api/galaxy/*`, `/api/leaderboard`, `/api/news` (GET)
- **Auth routes** (no auth): `/api/auth/register`, `/api/auth/verify`
- **Protected routes** (Bearer token): everything else

Auth pattern:
```typescript
const auth = await verifyToken(env.DB, request.headers.get('Authorization'));
if (!auth) return jsonError('Unauthorized', 401);
```

---

## Seed Scripts (Critical)

The Worker **cannot** generate galaxies or NPCs. Seed scripts run in Bun locally and produce SQL:

```bash
# Generate full galaxy + NPCs
bun run scripts/seed.ts > scripts/seed.sql
npx wrangler d1 execute tw3002-galaxy --remote --file=scripts/seed.sql

# Add NPCs to existing galaxy
bun run scripts/add-npcs.ts > scripts/add-npcs.sql
npx wrangler d1 execute tw3002-galaxy --remote --file=scripts/add-npcs.sql
```

Seed scripts import `@tw3002/engine` via **relative path** (not workspace):
```typescript
import { createGalaxy, generateNPCs } from '../../packages/engine/src/index.js';
```

The engine package must be resolvable from the script's location. The cloud workspace is listed in root `package.json` workspaces.

---

## NPC Density

Target: **15% of sector count**. Current deployed galaxy:
- 1000 sectors → 150 NPCs
- Script: `const NPC_COUNT = Math.round(SECTOR_COUNT * 0.15)`

This is configurable per galaxy. Don't hardcode counts.

---

## Environment & Secrets

**In `wrangler.toml` (vars, committed):**
```toml
[vars]
ENVIRONMENT = "development"
NPC_MODEL = "openai/gpt-5.4-nano"  # or whatever the user sets
```

**Set via `wrangler secret put` (never committed):**
```bash
npx wrangler secret put OPENROUTER_API_KEY
npx wrangler secret put ADMIN_SECRET
npx wrangler secret put DISCORD_WEBHOOK_URL
```

Do not put secrets in `wrangler.toml`. Wrangler rejects them.

---

## Deploy

```bash
cd cloud
npx wrangler deploy
```

The Worker auto-bundles TypeScript. No separate build step.

---

## Local Dev

```bash
npx wrangler dev          # Local dev server with local D1
```

Local D1 is a SQLite file, separate from the remote database. Migrations apply to whichever you target:
```bash
npx wrangler d1 migrations apply tw3002-galaxy          # local
npx wrangler d1 migrations apply tw3002-galaxy --remote # production
```

---

## Current Deployed State

| Property | Value |
|----------|-------|
| **Galaxy** | The Void — Shared Galaxy |
| **Sectors** | 1,000 |
| **NPCs** | 150 (15% density) |
| **Seed** | 42 |
| **URL** | `https://tw3002-api.prilldev.workers.dev` |

---

## Cloud vs Local Split

| Feature | Local CLI | Cloud API |
|---------|-----------|-----------|
| Galaxy generation | `createGalaxy()` in engine | Seed scripts in Bun |
| NPC ticks | `tickNPCs()` in engine | **Not implemented** — needs `/api/npc/tick` |
| Save format | Denormalized `saves` table | Normalized `player_ships`, `sectors`, `npcs` |
| Turn regen | `regenerateTurns()` on load | **Not implemented** — needs regen on `/api/player/ship` read |
| Auth | None (3 local slots) | Bearer token + email |
| LLM calls | Engine calls OpenRouter/Ollama directly | **Not implemented** — engine can't run in Worker |

---

## Things to Avoid

- **Don't import `@tw3002/engine` in Worker code** — it uses Node.js APIs
- **Don't use `CURRENT_TIMESTAMP` in `ALTER TABLE`** — same SQLite limitation as local, but D1 migrations are one-shot on deploy
- **Don't put secrets in `wrangler.toml`** — use `wrangler secret put`
- **Don't forget `--remote` on D1 execute** — without it you touch the local dev DB
- **Don't commit generated `.sql` files** — they're build artifacts from seed scripts

---

## Open Issues / Next Work

- **NPC tick endpoint:** `POST /api/npc/tick` — run NPC turns in the cloud (can use a scheduled Worker or cron trigger)
- **Turn regeneration:** Regenerate turns on player read based on `last_action_at`
- **LLM integration in Worker:** Either port a subset of the engine to Workers-safe code, or call OpenRouter directly from the Worker
- **Admin panel:** Web UI for galaxy management, player list, cost monitoring
- **Web client:** Svelte app consuming the same REST API
- **Email magic links:** Replace direct token return with real email sending (Resend/Postmark)

---

*This doc is for AI agents. API consumers should read cloud/README.md.*
