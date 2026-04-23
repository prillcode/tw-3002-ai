# 03-02-SUMMARY — Provider-Agnostic LLM Integration

**Status:** ✅ COMPLETE
**Executed:** 2026-04-22
**Duration:** ~1.5 hours (estimated 3-4 hours)

## What Was Built

### LLM Provider Layer (`packages/engine/src/llm/`)

**`provider.ts`** — Core interfaces:
- `LLMProvider` — `chat(messages, options)` → `ChatResponse`
- `ChatMessage`, `ChatOptions`, `ChatResponse`, `TokenUsage`
- `LLMConfig` — provider, model, apiKey, endpoint, temperature, maxTokens

**`ollama.ts`** — `OllamaProvider`:
- POSTs to `localhost:11434/api/chat`
- Supports JSON mode (`format: 'json'`)
- Default model: `llama3.2:3b`
- `isOllamaAvailable()` health check
- No API key needed

**`openrouter.ts`** — `OpenRouterProvider`:
- POSTs to `openrouter.ai/api/v1/chat/completions`
- OpenAI-compatible request format
- Default model: `openai/gpt-4o-mini`
- Auth via `Authorization: Bearer {apiKey}`
- Error handling: 401 (bad key), 429 (rate limit)
- `getSessionCost()` — estimates USD spent

**`mock.ts`** — `MockProvider`:
- 10-15 canned decisions per NPC type (trader/raider/patrol)
- Deterministic selection via prompt hash
- Zero network, zero cost — for testing/CI

**`factory.ts`** — `createProvider(config)`:
- Maps `LLMConfig.provider` to the right implementation
- Returns `null` for unknown/missing configs

**`config.ts`** — Config loader/saver:
- Loads `~/.tw3002/config.json`
- Auto-creates with `{ provider: "disabled" }` if missing
- Validates provider names, warns if OpenRouter key missing

**`prompts.ts`** — Prompt builder:
- `SYSTEM_PROMPT` — JSON schema instructions
- `buildPrompt(npc, galaxy, players)` — full context: stats, memory, nearby entities, port info
- `buildSystemPromptForType()` — type-specific hints (trader/raider/patrol)

**`parser.ts`** — Response parser:
- `parseNPCDecision(json, galaxy, currentSectorId)`
- Extracts JSON from markdown code blocks if needed
- Validates action type, param schema, and legality (e.g., move target must be a neighbor)
- Returns `null` on any failure → triggers fallback

### NPC Brain Integration

**`brain.ts`**: `decideAction()` is now **async and hybrid**:
```
1. No config / disabled → rule-based (instant)
2. Build provider from config
3. Build prompt from NPC state
4. Call LLM with 5s timeout
5. Parse JSON, validate action legality
6. Record reasoning in NPC memory
7. Any failure → silent fallback to rule-based
```

- Original `decideAction()` renamed to `decideRuleBased()` — kept intact as fallback
- `withTimeout()` helper wraps LLM calls

### Files Changed

```
packages/engine/src/llm/provider.ts    (NEW)
packages/engine/src/llm/ollama.ts      (NEW)
packages/engine/src/llm/openrouter.ts  (NEW)
packages/engine/src/llm/mock.ts        (NEW)
packages/engine/src/llm/factory.ts     (NEW)
packages/engine/src/llm/config.ts      (NEW)
packages/engine/src/llm/prompts.ts     (NEW)
packages/engine/src/llm/parser.ts      (NEW)
packages/engine/src/npcs/brain.ts      (+async hybrid decideAction)
packages/engine/src/index.ts           (+LLM exports)
```

## Verification Results

- ✅ Engine typecheck clean
- ✅ CLI typecheck clean
- ✅ Binary builds successfully (~100MB)
- ✅ Config defaults to `disabled` (safe out-of-box)
- ✅ Missing config file auto-creates
- ✅ Invalid provider name falls back to disabled
- ✅ `parseNPCDecision` rejects non-neighbor move targets
- ✅ `parseNPCDecision` handles markdown code blocks

## Skipped (Optional)

- **Task 9: Config CLI screen** — Can be added later as a Settings screen enhancement. Config is editable by hand for now.

## Notes
- **No LLM by default.** Users must create `~/.tw3002/config.json` and set `provider` to opt in.
- **Ollama path:** Install Ollama, `ollama pull llama3.2:3b`, set `{ "provider": "ollama" }` in config.
- **OpenRouter path:** Get API key from openrouter.ai, set `{ "provider": "openrouter", "apiKey": "..." }`.
- **Mock path:** Set `{ "provider": "mock" }` for deterministic testing.
- **Async decisions:** Any code calling `decideAction()` must now `await` it. The CLI currently doesn't trigger NPC decisions (just renders them), so this is a non-breaking change.
