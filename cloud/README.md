# TW 3002 AI Cloud (`tw3002-api`)

A Cloudflare Worker-based REST API for a shared online space trading/combat game inspired by classic BBS door games like *Trade Wars 2002*.

## Architecture & Stack

- **Runtime:** Cloudflare Worker (TypeScript, Wrangler v4)
- **Database:** Cloudflare D1 (SQLite) — schema includes galaxies, sectors, players, ships, NPCs, news, and PvP kills
- **Package Manager:** Bun
- **AI Integration:** Cloudflare Workers AI (optional) for NPC action decisions; falls back to deterministic rule-based logic

## The Void — Shared Galaxy

The current deployed galaxy:
- **Name:** *The Void — Shared Galaxy*
- **Sectors:** 1,000
- **NPCs:** 150 (15% density — one NPC per ~6.7 sectors)
- **Seed:** 42 (reproducible)
- **URL:** `https://tw3002-api.prilldev.workers.dev`

## Database Schema

| Table | Purpose |
|-------|---------|
| `galaxies` | Shared game worlds (e.g., *The Void — Shared Galaxy*, 1000 sectors) |
| `sectors` | Galaxy nodes with names, danger, ports, trade inventories (ore / organics / equipment), and warp connections |
| `players` | Cloud save state with email-based auth tokens |
| `player_ships` | One ship per galaxy per player; tracks credits, cargo, hull, shields, turns, upgrades, net worth, kills/deaths |
| `npcs` | Shared AI-driven NPCs with personas, ships, credits, cargo, and memory |
| `news` | Galaxy event log / headlines |
| `pvp_kills` | Combat kill records |

## API Endpoints

| Route | Auth | Purpose |
|---|---|---|
| `GET /health` | No | Health check |
| `POST /api/auth/register` | No | Email-based registration (magic link / token generation) |
| `POST /api/auth/verify` | No | Token validation |
| `GET /api/galaxy` | No | List active galaxies |
| `GET /api/galaxy/:id` | No | Galaxy details + player count |
| `GET /api/galaxy/:id/sectors` | No | All sectors (for client-side caching) |
| `GET /api/galaxy/:id/sector?id=` | No | Single sector details + NPCs present |
| `GET /api/leaderboard` | No | Leaderboard per galaxy |
| `GET /api/news` | No | Read news |
| `POST /api/news` | Yes | Publish news |
| `GET /api/player` | Yes | Get player profile |
| `GET /api/player/ship` | Yes | Get player's ship in a galaxy |
| `POST /api/player/ship` | Yes | Create a ship |
| `POST /api/player/ship/move` | Yes | Move ship between sectors |
| `POST /api/action/trade` | Yes | Trading actions |
| `POST /api/action/combat` | Yes | Combat actions |
| `GET/POST /api/npc/llm-health` | Admin header | Workers AI smoke test + lore quote |
| `GET/POST /api/npc/model-benchmark` | Admin header | Benchmarks model parse reliability, quote yield, and latency |

## Key Features

- **Open CORS:** Allows cross-origin requests (intended for a separate frontend client).
- **Token Auth:** Simple opaque Bearer tokens stored in D1, valid for 7 days.
- **Shared Universe:** Players share the same galaxy and sectors, including AI NPCs.
- **Seeded Data:** `scripts/seed.ts` generates a galaxy with ports, trade goods, and warp lanes. Run it with Bun to produce `seed.sql`, then execute against D1.
- **NPC Scripting:** `scripts/add-npcs.ts` generates additional NPCs for existing galaxies using a seed offset to avoid duplicates.

## Seeding a Galaxy

```bash
# Generate the full galaxy SQL (from cloud/ directory)
bun run scripts/seed.ts > scripts/seed.sql

# Apply to remote D1 database
npx wrangler d1 execute tw3002-galaxy --remote --file=scripts/seed.sql

# Add more NPCs to an existing galaxy
bun run scripts/add-npcs.ts > scripts/add-npcs.sql
npx wrangler d1 execute tw3002-galaxy --remote --file=scripts/add-npcs.sql
```

## Development Commands

```bash
bun run dev          # Local Wrangler dev server
bun run deploy       # Deploy to Cloudflare
bun run db:migrate   # Apply D1 migrations
bun run typecheck    # TypeScript check
```

## Worker AI Configuration

Set these in `wrangler.toml` / dashboard vars:

- `NPC_LLM_ENABLED` — `"true"` to enable LLM-assisted NPC action selection (`"false"` by default)
- `NPC_MODEL` — Workers AI model slug for NPC action decisions (default: `@cf/qwen/qwen3-30b-a3b-fp8`)
- `NPC_QUOTE_MODEL` — Workers AI model slug for quote/main-screen flavor text (default: `@cf/zai-org/glm-4.7-flash`)
- `AI` binding — configured via `[ai] binding = "AI"`

## Wrangler Secrets

Set these via `wrangler secret put <name>` — **do not** commit them:

```bash
npx wrangler secret put DISCORD_WEBHOOK_URL
npx wrangler secret put ADMIN_SECRET
```

- `DISCORD_WEBHOOK_URL` — Notifications
- `ADMIN_SECRET` — Admin operations

## Caveats

- **The Worker cannot import `@tw3002/engine` directly.** The engine uses Node.js APIs (`process`) that are unavailable in the Cloudflare Workers runtime. Seed scripts run in Bun (local) and generate SQL that is then executed against D1.
