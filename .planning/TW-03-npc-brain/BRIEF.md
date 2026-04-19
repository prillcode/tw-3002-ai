# TW-03: NPC Brain (LLM System)

## Work Identity
- **ID:** TW-03
- **Type:** Feature
- **Scope:** LLM-Driven NPC Decision System

## Objective
Build the differentiating feature: NPCs powered by LLM reasoning. Traders, raiders, and patrols that make contextual decisions, remember interactions, and create emergent gameplay. The "dormant galaxy" optimization keeps costs manageable.

## In Scope
- OpenRouter API integration
- NPC persona system (personalities, goals, backstories)
- Prompt engineering for game decisions
- Decision loop: state → LLM → validate → apply
- NPC memory (last 3 actions + structured grudges/alliances)
- Dormant galaxy system (2-3 sector activation radius)
- Response caching (skip LLM for identical situations)
- Multi-model support (cheap for routine, smart for key NPCs)
- NPC types: Trader, Raider, Patrol, Faction leaders

## Out of Scope
- Multi-agent debates (corporations deciding together)
- NPC-to-NPC direct conversation
- Full history/memory (human-like forgetting is intentional)
- Real-time NPC evolution (still login-driven)
- Training custom models

## Success Criteria
1. NPCs make contextual decisions (not random)
2. Same NPC in same situation → consistent behavior
3. NPCs show distinct personalities (cautious vs aggressive traders)
4. Dormant galaxy keeps costs to ~$0.025/session
5. Players can observe and predict NPC patterns
6. NPCs occasionally surprise (adapt to player actions)
7. 20 active NPCs don't cause perceptible delay

## Dependencies
- Blocked by: TW-02 (NPCs need game logic to interact with)
- Blocks: None (standalone feature)
- Related: TW-04 (cost monitoring, cloud deployment)

## References
- PRD: `docs/TW3002-PRD.md` Sections 4.2 (Dormant Galaxy), 7.1 (LLM Provider Strategy)
- OpenRouter: https://openrouter.ai/
