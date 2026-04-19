# TW 3002 AI — Product Requirements Document

> A spiritual successor to Trade Wars 2002 with LLM-driven NPCs. Terminal-native space trading where the galaxy evolves when you play.

**Document Status:** Final v1.1  
**Last Updated:** 2026-04-19  
**Companion Doc:** [Original Feasibility Study](./tw-3002-ai-feasibility.md)

---

## 1. Elevator Pitch

TW 3002 AI recreates the BBS-era classic Trade Wars 2002 as a terminal-native game with a twist: NPC traders, raiders, and factions are powered by LLM reasoning, not static scripts. Each play session feels alive as NPCs make contextual decisions, hold grudges, and adapt strategies based on what they observe.

The primary experience is a rich CLI/TUI application that can be launched standalone or invoked from AI coding agents (Pi, Claude Code, OpenCode, etc.) for assisted gameplay. A web client provides accessibility, connecting to the same shared backend.

---

## 2. Core Principles

1. **Terminal-Native First:** The CLI/TUI is the primary client. Keyboard-driven, ANSI-art style, authentic to the BBS experience.

2. **LLM-Assisted, Not LLM-Required:** Players can use their own AI agent for decision advice, but the game is fully playable without it.

3. **Galaxy Evolves on Play:** No cron jobs. NPCs take their turns when players log in. The universe is "paused" between sessions.

4. **Dormant Galaxy:** Only NPCs near the player are "awake" and LLM-driven. The rest are low-cost or frozen.

5. **Shared State, Thin Clients:** All game state lives in the cloud (or local SQLite). Clients render; they don't decide.

6. **Multiplayer by Model:** Different LLM providers create different galaxy "cultures." This is a feature, not a bug.

---

## 3. Architecture

### 3.1 High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                               CLIENTS                                        │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐  │
│  │ CLI Binary      │    │ Web Client      │    │ AI Agent Invocation     │  │
│  │ (Primary)       │    │ (Secondary)     │    │ (Pi, Claude Code, etc.) │  │
│  │ - Rich TUI      │    │ - Browser UI    │    │ - tw3002 play           │  │
│  │ - ANSI art      │    │ - Mouse friendly│    │ - Agent assists player    │  │
│  │ - Player's LLM  │    │ - Server LLM    │    │ - Player's LLM          │  │
│  │   for advice    │    │   for advice    │    │   for advice            │  │
│  └────────┬────────┘    └────────┬────────┘    └────────────┬────────────┘  │
└───────────┼──────────────────────┼─────────────────────────┼───────────────┘
            │                      │                         │
            └──────────────────────┼─────────────────────────┘
                                   │ HTTPS/WebSocket
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                         │
│                    ┌─────────────────────┐                                   │
│                    │  Cloudflare Workers │                                  │
│                    │  (API Layer)        │                                  │
│                    │                     │                                  │
│                    │  - Authentication   │                                  │
│                    │  - Game logic       │                                  │
│                    │  - Turn validation  │                                  │
│                    │  - NPC brain calls  │◄─── OpenRouter / Anthropic      │
│                    │    (server pays)    │     (NPC LLM costs)              │
│                    └──────────┬──────────┘                                  │
│                               │                                             │
│                               ▼                                             │
│                    ┌─────────────────────┐                                   │
│                    │  Cloudflare D1      │                                  │
│                    │  (SQLite Database)  │                                  │
│                    │                     │                                  │
│                    │  - Galaxy state     │                                  │
│                    │  - Player profiles    │                                  │
│                    │  - NPC memory       │                                  │
│                    │  - Market history   │                                  │
│                    │  - Combat logs      │                                  │
│                    └─────────────────────┘                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         HOME/DOCKER MODE                                     │
│                    ┌─────────────────────┐                                   │
│                    │  Local Server         │                                  │
│                    │  (Bun runtime)       │                                  │
│                    │                     │                                  │
│                    │  - Same API as CF    │                                  │
│                    │  - Local SQLite      │                                  │
│                    │  - Shared LLM key    │◄─── Configured by host          │
│                    │    (OpenRouter/etc)  │                                  │
│                    └─────────────────────┘                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Client-Server Contract

**Clients Never:**
- Hold authoritative game state
- Run NPC brain logic
- Validate game rules
- Persist data locally (beyond transient cache)

**Clients Always:**
- Render state from API
- Capture user input
- Send actions to API for validation
- Display results

### 3.3 State Persistence

| Mode | Database | Use Case |
|------|----------|----------|
| Cloud | Cloudflare D1 | Shared multiplayer galaxy, global access |
| Home | Local SQLite file | Private solo/family play, zero cloud costs |

**State Includes:**
- Galaxy map (sectors, connections, ports)
- Player ships (location, cargo, credits, upgrades)
- NPCs (persona, current state, structured memory)
- Market data (prices, trends)
- Combat history
- Corporation data (if implemented)

---

## 4. Game Mechanics

### 4.1 Core Loop

1. **Login → Load Galaxy State** (NPCs "wake up" near player)
2. **NPCs Take Turns** (LLM-driven decisions for active NPCs)
3. **Player Takes Turn** (move, trade, combat, etc.)
4. **State Persisted** (D1 or SQLite updated)
5. **Logout → Galaxy "Pauses"**

### 4.2 Dormant Galaxy System

**Active Radius:** 2-3 sectors from player location

| NPC State | Behavior | Cost |
|-----------|----------|------|
| **Awake** | Full LLM-driven reasoning, makes decisions | ~$0.001/turn |
| **Dormant** | Rule-based or frozen, no LLM calls | ~$0 |
| **Background** | Cached/decayed state, minimal updates | ~$0 |

**Benefits:**
- Caps LLM costs to ~10-20 NPCs per session, not 100+
- Focuses "aliveness" where player experiences it
- Allows large galaxy (100+ sectors) without proportional costs

### 4.3 NPC Brain Model

**Decision Cycle:**
```
Input: Game state + NPC persona + Recent memory (last 3 actions + structured grudges)
  ↓
LLM Call: "What do you do?"
  ↓
Output: Structured action (move, trade, attack, flee, etc.)
  ↓
Validation Layer: Check if action is legal
  ↓
Apply to game state → Persist → Narrate result
```

**Memory Structure (Simple):**
```typescript
interface NPCMemory {
  lastActions: Action[];           // Last 3 turns
  grudges: { target: string; reason: string; severity: number }[];
  alliances: { target: string; formedAt: Date }[];
  marketObservations: { sector: number; commodity: string; price: number; at: Date }[];
}
```

**No Full History:** NPCs don't remember everything. They have "human-like" memory: recent events clear, old events fuzzy/structured only.

### 4.4 Multiplayer Model

**Async Shared Galaxy:**
- Multiple players can join the same galaxy (hosted at `galaxy3002.pages.dev` or custom)
- Players never overlap in real-time; turns are sequential per player login
- When Player B logs in, they see the galaxy as Player A left it, plus NPC evolution

**Fairness via Server Authority:**
- NPC brains always run server-side (or host-side in Docker)
- All players in a galaxy experience the same NPC behavior model
- The "galaxy personality" is determined by which LLM the host/server uses for NPCs

---

## 5. Clients

### 5.1 CLI Binary (Primary)

**Purpose:** Rich, authentic terminal experience

**Tech Stack:** [Bun](https://bun.sh/) runtime with [Ink](https://github.com/vadimdemedes/ink) (React for CLI)
- **Bun** for TypeScript-native development, fast startup, and built-in SQLite support via `bun:sqlite`
- **Ink** for modern component model, easier testing, and active maintenance
- Rich ANSI art via Ink's Box/Text components
- Keyboard navigation via Ink's useInput hook

**Features:**
- ANSI art welcome screens
- ASCII galaxy map with navigation
- Real-time market tickers
- Combat visualization
- News/intel feed
- Keyboard navigation (arrows, enter, escape, hotkeys)

**Distribution:**
```bash
npm install -g tw3002
# or
brew install tw3002
# or
npx tw3002 play
```

**AI Agent Integration:**
When launched from Pi, Claude Code, etc.:
```bash
> tw3002 play --galaxy andromeda-7
# CLI streams game state
# AI agent can read output and suggest: "Sector 42 has cheap ore, consider buying"
# Player decides: follow advice or not
```

### 5.2 Web Client (Secondary)

**Purpose:** Accessibility — play from any browser without installation

**Architecture:**
- Static frontend (Svelte/Vanilla JS) hosted on Cloudflare Pages
- Same API calls as CLI
- Server-side NPC brains (host pays)
- Optional: User can connect their LLM for advice mode (client-side calls with user's key)

**Trade-offs:**
- Simpler UI (no rich ANSI art)
- Server bears NPC LLM costs
- No installation required

### 5.3 Client Comparison

| Feature | CLI | Web |
|---------|-----|-----|
| Rich TUI/ANSI | ✅ Full | ⚠️ Limited |
| Keyboard nav | ✅ Native | ⚠️ Emulated |
| Installation required | ✅ npm/brew | ❌ None |
| AI advice | Player's LLM | Optional (user key) |
| NPC costs | Player bears (indirect) | Host bears |
| Offline mode | ❌ (needs API) | ❌ |
| BBS authenticity | ✅ High | ⚠️ Medium |

---

## 6. Hosting Options

### 6.1 Cloudflare Free Tier (Recommended for Shared)

**Stack:**
- Workers (API): 100k requests/day
- D1 (SQLite): 5GB storage, 100k writes/day
- Pages (Web client): Unlimited
- Cron: Not used (login-driven evolution)

**Cost:** $0 for hobby scale

**Limits:**
- ~100k NPC actions/day = ~4,000 NPC turns/hour sustained
- With dormant galaxy (20 active NPCs): ~200 player sessions/day before limits

### 6.2 Home Docker (Private Play)

**Stack:**
- Bun runtime server
- SQLite file (no cloud)
- Configured LLM key (OpenRouter, etc.)

**Cost:** $0 (just LLM usage)

**Sharing:** Cloudflare Tunnel for temporary public URL

### 6.3 VPS (Future-Proofing)

**When to upgrade:**
- Hit D1 write limits
- Want WebSocket features
- Need guaranteed uptime

**Options:** Railway ($5), Render, Hetzner (€4), Oracle Free Tier

---

## 7. Cost Model

### 7.1 NPC LLM Provider Strategy

| Tier | Provider | Use Case | Cost |
|------|----------|----------|------|
| **Dev/Testing** | GitHub Models (free) or Ollama local | Local dev, CI testing | $0 |
| **Budget Production** | OpenRouter + GPT-4o-mini / Claude Haiku | Public galaxies, most NPCs | ~$0.0005/1K tokens |
| **Premium Galaxies** | Direct Anthropic (Claude) or OpenAI | Special "smart NPC" galaxies | ~$0.003-0.015/1K tokens |
| **Player Advice** | Player's own key (via AI CLI) | Optional AI assistance | Player pays |

**OpenRouter Benefits:**
- One API key, multiple models (switch GPT/Claude/Llama without code changes)
- Competitive pricing, built-in fallbacks
- Route different models for different NPC "intelligence levels"

### 7.2 NPC LLM Costs

**Assumptions:**
- 20 active NPCs per session
- 5 turns per NPC per session
- ~500 tokens per NPC decision (prompt + response)
- Model: GPT-4o-mini via OpenRouter (~$0.0005/1K tokens)

**Math:**
```
20 NPCs × 5 turns × 500 tokens × $0.0005/1K tokens
= 50,000 tokens × $0.0000005/token
= $0.025 per player session

100 sessions/day = $2.50/day = $75/month
```

**Mitigations:**
- Dormant galaxy (caps at ~20 NPCs, not 100+)
- Response caching (same state = same decision, skip LLM call)
- Cheaper models for "background" NPCs
- Rate limiting for public galaxies

### 7.3 Who Pays What

| Cost | Cloud Mode | Home Mode |
|------|------------|-----------|
| Hosting | $0 (CF free tier) | $0 (your electricity) |
| NPC LLM calls | Host (you) | Host (you) |
| Player advice LLM | Player (their key) | Player (shared key) |

---

## 8. Tech Stack Summary

| Component | Technology |
|-----------|------------|
| CLI Runtime | Bun (TypeScript-native, built-in SQLite) |
| CLI Framework | Ink (React for terminals) |
| Local Database | `bun:sqlite` (Phase 1-2) |
| Cloud Database | Cloudflare D1 (Phase 3+) |
| Server API | Cloudflare Workers |
| NPC LLM | OpenRouter → GPT-4o-mini / Claude Haiku |
| Dev LLM | GitHub Models (free) or Ollama (local) |

---

## 9. Roadmap

### Phase 1: CLI MVP (Weeks 1-4)
**Goal:** Single-player terminal experience, local SQLite via Bun

**Deliverables:**
- [ ] CLI skeleton with Ink (Bun runtime)
- [ ] Local SQLite schema (galaxy, players, NPCs)
- [ ] Basic sector navigation (FedSpace, 10 sectors)
- [ ] Port trading (buy/sell ore, organics, equipment)
- [ ] 1 LLM-driven NPC (trader) with simple persona
- [ ] ANSI welcome screen + ship status display

**Success Criteria:** Player can log in, trade at 2-3 ports, see 1 NPC making decisions, logout and resume.

### Phase 2: Dormant Galaxy (Weeks 5-8)
**Goal:** Scale to 50+ sectors, add danger, cost controls

**Deliverables:**
- [ ] Galaxy generation (sectors, connections, port types)
- [ ] 3 NPC types (trader, raider, patrol) with distinct personas
- [ ] Dormant galaxy logic (only 2-sector radius is LLM-driven)
- [ ] Combat system (flee, fight, bribe)
- [ ] Ship upgrades (engines, weapons, shields, cargo)
- [ ] Cloudflare D1 schema + migration from SQLite

**Success Criteria:** Galaxy feels alive in player vicinity, NPCs show distinct behaviors, costs capped, works in both local and cloud mode.

### Phase 3: Shared Galaxy (Weeks 9-12)
**Goal:** Multiplayer via shared backend, leaderboards

**Deliverables:**
- [ ] Cloudflare Workers API
- [ ] Player authentication (simple token-based)
- [ ] Shared galaxy state (D1)
- [ ] Leaderboards (net worth, combat rating)
- [ ] Web client (minimal viable UI)
- [ ] Galaxy "personalities" (document Claude vs GPT behavior)

**Success Criteria:** 2+ players can share a galaxy, see each other's actions indirectly, compete on leaderboard.

### Phase 4: Polish & Release (Weeks 13-16)
**Goal:** Public beta, community feedback, refinement

**Deliverables:**
- [ ] CLI package distribution (npm, brew)
- [ ] Documentation & tutorials
- [ ] Balancing (prices, NPC difficulty)
- [ ] Bug fixes from beta
- [ ] Optional: Corporation system (simplified, non-LLM-coordinated)

---

## 10. Decisions on Open Questions

1. **Galaxy Reset:** Configurable via admin panel. Default: persistent galaxies with optional scheduled resets. Future: player voting system for reset timing.

2. **CLI Tech Stack:** [Ink](https://github.com/vadimdemedes/ink) selected for modern React-based CLI development.

3. **Auth Model:** Email-based tokens. Players opt-in with email to build community and enable notifications.

## 11. Future Considerations

1. **Corporations:** Simplified version — players form corps, share treasury, but NPC coordination is via game state, not multi-agent LLM debates.

2. **Mobile:** Is a mobile client worth it? Probably not for MVP; web client handles tablets.

3. **Modding:** Allow custom galaxy generation rules? Custom NPC personas? Post-MVP.

4. **Admin Panel:** Web interface for galaxy management, reset configuration, and player voting systems.

---

## 12. Key Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary client | CLI binary (Ink) | Terminal-native, modern React-based TUI |
| Runtime | Bun | TypeScript-native, fast, built-in SQLite |
| AI agent integration | Launch CLI from Pi/Claude/etc. | Player gets AI advice, but controls decisions |
| NPC LLM provider | OpenRouter (GPT-4o-mini default) | Flexible, cost-effective, multi-model support |
| State persistence | Cloudflare D1 or local SQLite | Thin clients, shared state |
| NPC evolution | Login-driven, no cron | Costs only when played, simpler architecture |
| NPC scope | Dormant galaxy (proximity-based) | Caps LLM costs, focuses aliveness |
| NPC memory | Last 3 actions + structured grudges | Human-like, manageable, not overwhelming |
| Multiplayer | Async shared galaxy | No real-time complexity, TW2002-authentic |
| Cost bearer | Host pays NPC LLM, player pays advice (optional) | Sustainable model |
| Web client | Secondary, simpler | Accessibility without compromising CLI |
| Corp dynamics | Game-state reactions only | Avoid multi-agent coordination complexity |
| Galaxy reset | Admin-configurable | Flexible per-galaxy, voting system future |
| Auth | Email tokens | Community building, opt-in notifications |

---

## 13. Document History

- **v0.1:** Original feasibility study (tw-3002-ai-feasibility.md)
- **v1.0:** Initial PRD — consolidated decisions after architecture review
- **v1.1:** Final PRD — locked in Bun runtime, OpenRouter LLM provider, Ink CLI framework

---

*This document is the authoritative reference for TW 3002 AI development. Changes should be reviewed and versioned.*
