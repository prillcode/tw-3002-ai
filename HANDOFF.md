# TW 3002 AI — Session Handoff

Date: 2026-04-30
Version: CLI v0.6.0 | API v0.5.5 | Web Client v0.5.5
Repo: https://github.com/prillcode/tw-3002-ai

---

## Session Accomplishments

### ✅ Cloudflare Workers AI integration for cloud/web NPC path

Implemented:
- Added Workers AI binding + env config in `cloud/wrangler.toml`
  - `NPC_LLM_ENABLED`
  - `NPC_MODEL`
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
- Reports:
  - decision parse rate
  - quote non-empty rate
  - avg latency
  - score + ranked winner
- Query params:
  - `models` (comma-separated)
  - `decisionRuns` (1–50)
  - `quoteRuns` (1–20)

### ✅ Response parsing fixes for Cloudflare model outputs

Fixes:
- Added support for `choices[0].text` extraction
- Hardened action parsing with JSON + heuristic fallbacks
- Prevented JSON parse failures from short-circuiting fallback parsing

### ✅ Active model update

Current worker var default:
- `NPC_MODEL = "@cf/qwen/qwen3-30b-a3b-fp8"`

---

## Validation + Deployment

Executed:
- `cd cloud && bun run typecheck` ✅
- multiple `wrangler deploy` runs ✅

Latest deployed worker version (during this session):
- `b8e4d425-d2cf-42ee-9216-df831c8adee0`

Observed behavior:
- `llm-health` now returns non-empty text for current model
- `npc/tick` now shows non-zero `llmDecisions` in at least some runs

---

## Next Steps (Recommended)

1. **Run model benchmark bake-off** on 3–5 candidate models and compare parse rate/latency/cost.
2. **Split model roles** if needed:
   - cheap model for high-volume NPC action selection
   - better narrative model for lore quotes/news flavor
3. **Tighten quote prompt post-processing** to suppress occasional instruction-like outputs.
4. Optional: persist benchmark snapshots in DB/news for trend tracking.

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
curl -sS "https://tw3002-api.prilldev.workers.dev/api/npc/model-benchmark?models=@cf/qwen/qwen3-30b-a3b-fp8,@cf/zai-org/glm-4.7-flash&decisionRuns=20&quoteRuns=8" \
  -H "X-Admin-Secret: <ADMIN_SECRET>"
```

---

## Files Changed This Session

- `cloud/wrangler.toml`
- `cloud/src/index.ts`
- `cloud/src/routes/npc.ts`
- `cloud/README.md`
- `HANDOFF.md`

---

*See you in the black, Commander.* 🌌
