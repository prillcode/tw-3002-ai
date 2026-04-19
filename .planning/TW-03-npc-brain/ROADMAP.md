# TW-03 Roadmap: NPC Brain (LLM System)

**Estimated Total:** 37-51 hours (5-6 focused sessions)

## Phase 1: LLM Integration (3-4 hours)
**Goal:** OpenRouter API client working

**Deliverables:**
- [ ] `src/llm/client.ts` — OpenRouter API wrapper
- [ ] Support models: gpt-4o-mini, claude-3-haiku
- [ ] Request/response types
- [ ] Error handling (retry, fallback models)
- [ ] Cost tracking (per call, per session)
- [ ] Dev mode: GitHub Models or mock responses

**Success:** Can call OpenRouter and get structured game decisions.

---

## Phase 2: Prompt Engineering (6-10 hours)
**Goal:** Reliable NPC decision prompts

**Deliverables:**
- [ ] `src/prompts/base.ts` — system prompt template
- [ ] `src/prompts/trader.ts` — trader persona prompts
- [ ] `src/prompts/raider.ts` — raider persona prompts
- [ ] `src/prompts/patrol.ts` — patrol persona prompts
- [ ] Structured output format (JSON action schema)
- [ ] Prompt versioning (A/B test improvements)
- [ ] Prompt testing harness (replay situations)

**Success:** Prompts reliably produce valid, in-character actions.

---

## Phase 3: Decision Loop (5-7 hours)
**Goal:** State → LLM → Action pipeline

**Deliverables:**
- [ ] `src/brain/decision.ts` — decideAction(npc, gameState)
- [ ] State serialization for prompt context
- [ ] Action parsing and validation
- [ ] Illegal action rejection (re-prompt or fallback)
- [ ] Narrative generation (NPC "thinking" flavor text)
- [ ] Decision logging (for debugging, not player-visible)

**Success:** NPC takes sensible actions based on game state.

---

## Phase 4: NPC Memory (5-6 hours)
**Goal:** Limited but meaningful memory

**Deliverables:**
- [ ] `src/memory/types.ts` — NPCMemory interface
- [ ] Last 3 actions (with outcomes)
- [ ] Grudges list (who wronged me, why, severity)
- [ ] Alliances list (who I trust)
- [ ] Market observations (recent price memories)
- [ ] Memory summarization (compress old memories)
- [ ] Memory decay (old grudges fade)

**Success:** NPCs remember recent events, forget ancient history.

---

## Phase 5: Dormant Galaxy (4-6 hours)
**Goal:** Cost control via selective activation

**Deliverables:**
- [ ] `src/dormant/radius.ts` — calculate active sector radius
- [ ] NPC activation/deactivation logic
- [ ] Background NPCs (rule-based or frozen)
- [ ] Awakening transitions (frozen → LLM-driven)
- [ ] State persistence for dormant NPCs
- [ ] Cost per session tracking and display

**Success:** Only ~20 NPCs active per session, costs capped.

---

## Phase 6: Response Caching (3-4 hours)
**Goal:** Skip redundant LLM calls

**Deliverables:**
- [ ] `src/cache/lru.ts` — situation hash → decision cache
- [ ] Cache key: hash of (npc_persona + game_state_subset)
- [ ] TTL by situation type (volatile vs stable)
- [ ] Cache hit/miss metrics
- [ ] Manual cache invalidation (for testing)

**Success:** Identical situations don't trigger new LLM calls.

---

## Phase 7: NPC Types & Personas (6-8 hours)
**Goal:** Diverse NPC behaviors

**Deliverables:**
- [ ] 3 Trader personas: Cautious, Aggressive, Opportunistic
- [ ] 2 Raider personas: Pirate (kill), Thief (steal cargo)
- [ ] 1 Patrol persona: Enforcer (protects FedSpace)
- [ ] Persona selection at galaxy generation
- [ ] Faction alignment (if applicable)
- [ ] Player-reputation tracking per NPC

**Success:** Players can identify and exploit NPC personality patterns.

---

## Phase 8: Integration & Balance (5-6 hours)
**Goal:** NPCs feel alive, not overwhelming

**Deliverables:**
- [ ] Hook NPC brain into TW-02 game engine
- [ ] NPC turns on player login (dormant → active → decisions)
- [ ] Balance: NPCs don't dominate player
- [ ] Balance: NPCs aren't pushovers
- [ ] Emergency brake (disable LLM, use rule fallback)
- [ ] Cost monitoring dashboard

**Success:** Galaxy feels populated and dynamic, costs stay low.

---

## Phase Completion Order
1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

Phases 1-7 can use mock game state. Phase 8 requires TW-02 integration.

---

## Definition of Done
- All 8 phases complete
- 20+ NPCs can coexist without breaking economy or combat balance
- Costs stay under $0.05 per average session
- NPCs feel distinct and memorable
- Players strategize around NPC behavior
- Ready for cloud deployment (TW-04)
