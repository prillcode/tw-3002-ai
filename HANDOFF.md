# TW 3002 AI — Session Handoff

Date: 2026-05-02
Version: CLI v0.6.0 | API v0.5.6 | Web Client v0.5.5
Repo: https://github.com/prillcode/tw-3002-ai

---

## Session Accomplishments

### ✅ Cloudflare Workers AI integration for cloud/web NPC path

Implemented:
- Added Workers AI binding + env config in `cloud/wrangler.toml`
  - `NPC_LLM_ENABLED`
  - `NPC_MODEL` / `NPC_QUOTE_MODEL`
  - `[ai] binding = "AI"`
- Wired AI options through worker runtime in `cloud/src/index.ts`
  - `/api/npc/tick` now receives AI options
  - scheduled cron tick now receives AI options
- Extended NPC tick logic in `cloud/src/routes/npc.ts`
  - LLM-assisted action selection with deterministic fallback
  - `llmDecisions` metric added to tick summary

### ✅ Admin AI test endpoint + debugging

Added endpoint:
- `GET/POST /api/npc/llm-health` (admin header required)

Capabilities:
- Runs model smoke test and returns lore quote
- Supports `?debug=1` for payload-shape diagnostics (keys/raw preview)

### ✅ Model benchmarking endpoint

Added endpoint:
- `GET/POST /api/npc/model-benchmark` (admin header required)

Capabilities:
- Benchmarks one or more models
- Reports: decision parse rate, quote non-empty rate, avg latency, score + ranked winner
- Query params: `models`, `decisionRuns` (1–50), `quoteRuns` (1–20)

### ✅ Response parsing fixes for Cloudflare model outputs

Fixes:
- Added support for `choices[0].text` extraction
- Hardened action parsing with JSON + heuristic fallbacks
- Prevented JSON parse failures from short-circuiting fallback parsing

### ✅ Split model roles — NPC decisions vs quote generation

Added:
- `NPC_QUOTE_MODEL` env var — separate model for quote/flavor text generation
- Passed `quoteModel` through health, benchmark, and tick handlers
- Updated `cloud/README.md` with new env var docs

### ✅ Model swap based on benchmark results

Swapped models in `wrangler.toml`:
- `NPC_MODEL` = `@cf/zai-org/glm-4.7-flash` (better parse rate for NPC decisions)
- `NPC_QUOTE_MODEL` = `@cf/qwen/qwen3-30b-a3b-fp8` (better creative output for quotes)

### ✅ Quote post-processing with `cleanQuote()`

Added in `cloud/src/routes/npc.ts`:
- Strips `<think>` blocks from reasoning models
- Takes first non-empty line only
- Filters instruction echo patterns ("Do not", "Output only", "No preamble", etc.)
- Enforces 3–22 word count range
- Applied in both health check and benchmark endpoints

---

## Validation + Deployment

Executed:
- `cd cloud && bun run typecheck` ✅
- `bun run deploy` to Cloudflare ✅

Latest deployed worker version:
- `d5e879fb-5459-444d-b1a2-9a40c96c48ae` (May 2, 2026)

Active model configuration:
- `NPC_MODEL` = `@cf/zai-org/glm-4.7-flash` (NPC action decisions)
- `NPC_QUOTE_MODEL` = `@cf/qwen/qwen3-30b-a3b-fp8` (quote/flavor text)

### Production D1 Database Snapshot

| Resource | Count |
|---|---|
| Players (accounts) | 5 |
| Ships (active players) | 3 |
| Galaxies | 1 ("The Void", 1000 sectors) |
| NPCs | 150 |
| Planets | 0 |

Active players:
- `prillcode@gmail.com` — Aarons StarTrader (Merchant) — Sector 318, 1,792 credits
- `prilldev@gmail.com` — Firemen fire (Scout) — Sector 0, 5,000 credits
- `test-stardock@example.com` — TestShip (Merchant) — Sector 13, 2,700 credits

No external/third-party players have joined yet — all accounts are developer/tester owned.

---

## Next Steps (Recommended)

1. **Wire `/api/npc/llm-health` quotes into a client UI** — currently neither the CLI TUI (uses local LLM) nor the web client display the Cloudflare-generated quotes. Options:
   - Add a quote bar to the web game main screen
   - Add a `/api/galaxy/quote` public endpoint for non-admin consumption
2. **Test NPC tick with LLM enabled** — the cron runs every 5 min; verify `llmDecisions > 0` appears in tick stats when `NPC_LLM_ENABLED=true`.
3. **Seed planets** — the database has 0 planets; add planet generation to galaxy creation so trade routes / ports exist.
4. **Persist benchmark snapshots** in DB for trend tracking over time.
5. **Invite real players** — the galaxy is stable and ready for external testers.

---

## Quick Resume Commands

```bash
cd /home/prill/dev/tw-3002-ai

# validate cloud worker
cd cloud && bun run typecheck

# deploy
bun run deploy

# AI health (admin)
curl -sS "https://tw3002-api.prilldev.workers.dev/api/npc/llm-health" \
  -H "X-Admin-Secret: <ADMIN_SECRET>"

# AI health with debug payload shape
curl -sS "https://tw3002-api.prilldev.workers.dev/api/npc/llm-health?debug=1" \
  -H "X-Admin-Secret: <ADMIN_SECRET>"

# model benchmark
curl -sS "https://tw3002-api.prilldev.workers.dev/api/npc/model-benchmark?models=@cf/zai-org/glm-4.7-flash,@cf/qwen/qwen3-30b-a3b-fp8&decisionRuns=20&quoteRuns=8" \
  -H "X-Admin-Secret: <ADMIN_SECRET>"

# query production D1
cd cloud && npx wrangler d1 execute tw3002-galaxy --remote \
  --command "SELECT p.email, ps.ship_name, ps.credits, ps.current_sector FROM player_ships ps JOIN players p ON p.id = ps.player_id ORDER BY ps.created_at DESC;"
```

---

## Files Changed This Session

- `cloud/wrangler.toml` — model swap + `NPC_QUOTE_MODEL` env var
- `cloud/src/index.ts` — wired `quoteModel` through all handlers
- `cloud/src/routes/npc.ts` — `cleanQuote()` post-processing, quote model separation
- `cloud/README.md` — documented `NPC_QUOTE_MODEL`
- `HANDOFF.md`

## Commits Pushed

```
d92ab7a fix(npc): swap decision/quote models based on benchmark + add cleanQuote post-processing
18dce84 feat(cloud): add separate NPC_QUOTE_MODEL for quote/flavor text generation
```

---

*See you in the black, Commander.* 🌌
