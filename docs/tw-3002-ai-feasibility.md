# TW 3002 AI: Trade Wars 2002 Revival with LLM-Driven NPCs

> A feasibility study and project scope for recreating the Trade Wars 2002 experience as a Pi coding agent extension, enhanced with LLM-driven AI for emergent multiplayer simulation.

---

## Context

Trade Wars 2002 was the "granddaddy of all BBS games" (netgames, 1994). It was a turn-based space trading and combat game that ran on BBSes throughout the 90s. The project is a spiritual successor and recreation using Pi's TUI extension capabilities, with a twist: LLM-driven NPCs that make the galaxy feel alive.

**Project name:** TW 3002 AI  
**URL:** galaxy3002 (e.g., https://galaxy3002.pages.dev)  
**Key insight:** In the LLM/Agent age, we can do more than clone TW2002 mechanics — we can create an *always-fresh* experience where NPCs are driven by LLM reasoning, making the game feel alive in a way static AI cannot achieve.

**Hosting:** Designed for Cloudflare's free tier (D1 + Workers + Cron), with optional home Docker deployment and Cloudflare Tunnel for public sharing. Deployed at **galaxy3002**.

**Reference:** [[BBS Era Overview]], [[Trade Wars 2002]]

---

## The Core Differentiator: LLM-Driven NPCs

Instead of static rule-based NPCs (random tables, scripted behaviors), every NPC is an LLM agent that:
- Reasons about current game state
- Makes contextually appropriate decisions
- Adapts strategy based on what it observes
- Narrates events in-character
- Has persistent memory across turns

**Static NPC (hollow):**
```typescript
if (orePrice < 100) buyOre();
if (playerIsWeak && myStrength > playerStrength) attack();
```

**LLM-driven NPC (alive):**
```typescript
const decision = await llm.call(`
You are ${npc.name}, a ${npc.persona} trader.
Current market: ore=${orePrice}, organics=${orgPrice}
Your cargo: ${npc.cargo}, credits: ${npc.credits}
You've heard rumors that ${otherNpc.name} is stockpiling equipment.
What do you do and why? Respond with one action.
`);
// LLM might: corner the market, form a temporary alliance, abandon a losing route, etc.
```

The trade/combat/corp meta becomes *emergent* rather than scripted. Raiders have personalities. Traders have agendas. Corporations debate and betray organically.

---

## What Pi Extensions Are Good At

- **Single-session state** — game state persists in session entries via `pi.appendEntry()`
- **TUI rendering** — ANSI art style screens, menus, ASCII maps
- **Turn-based commands** — fits the "type a command, get a response" model perfectly
- **Keyboard input** — arrow keys, enter, escape for menu navigation
- **Custom tools** — the LLM can call game actions as tools
- **Model connectivity** — already built-in, no extra integration work

---

## The Multiplayer Problem (Solved by LLM NPCs)

**True real-time multiplayer with real humans is hard**, but LLM-driven NPCs solve the social simulation problem:

| Approach | How | Feel |
|----------|-----|------|
| **LLM-driven galaxy** | AI traders, raiders, corporations exist and act in the galaxy | Feels like multiplayer because AI "reasons" |
| **Pass-and-play** | Multiple users share the same pi session, take turns | Couch co-op, nostalgia of sharing an account |
| **Asynchronous multiplayer** | Players join shared galaxy, interact via turns | Real humans compete against LLM NPCs + each other |
| **Leaderboards** | Scores persisted, compared | Light social layer |

**The goal:** A shared galaxy where players compete against *and alongside* LLM-driven entities that feel like real players.

---

## Architecture

### Layer 1: Pi Extension (The Interface)

```
pi extension
├── Game engine (galaxy state, trading, combat, rules)
├── TUI component (how you see/interact with the world)
│   ├── ANSI welcome screen
│   ├── Galaxy map (ASCII sector network)
│   ├── Trading interface
│   ├── Combat interface
│   └── News/intel feed
├── LLM-driven NPC Agents (one per NPC)
│   ├── Trader AI — makes trade decisions
│   ├── Raider AI — assesses targets, plans attacks
│   ├── Corp AI — debates strategy, votes, betrays
│   └── Faction AI — controls Ferrengi patrols, events
├── Custom tool: "game_action" — player acts via LLM calls
└── Session state — player ship, current sector, etc.
```

### Layer 2: Game Server (The Backend)

For persistent shared state and scheduled NPC turns:

```
Node.js / Bun server
├── REST or WebSocket API — pi extension + clients connect here
├── SQLite (Turso) — persistent galaxy state, player records, NPC memory
├── NPC Brain Scheduler — runs NPC turns on a cron (every N minutes)
│   └── Calls LLM for each active NPC, commits actions to DB
├── Event system — generates rumors, news, cosmic events
└── Player management — auth, profiles, leaderboards
```

### Layer 3: Persistence (Turso/SQLite)

Cloud-hosted SQLite via Turso gives us:
- **Shared state** — all players and NPCs see the same galaxy
- **NPC memory** — NPC decisions and context persisted for next turn
- **Serverless** — cheap/free tier for hobby project
- **Simple** — no schema migrations, just `libsql` client
- **Offline-capable** — local SQLite replica for dev/testing

**Tables:**
- `galaxy` — sectors, connections, ports, planets
- `players` — ships, credits, cargo, location
- `npcs` — persona, memory, current state
- `npc_decisions` — history of LLM-driven choices
- `market_events` — price fluctuations, rumors
- `combat_log` — battles, outcomes
- `corporations` — member lists, assets, treasury

---

## The Offline NPC Problem (Solved by Cron)

In a turn-based game, NPCs need to act *between* player sessions for the galaxy to feel alive.

**Solution:** Scheduled NPC turns via cron job + Turso.

```
Every 15 minutes:
1. Cron triggers NPC Brain Scheduler
2. For each active NPC:
   a. Load current state from Turso
   b. Load NPC memory (recent decisions)
   c. Call LLM with game state + persona
   d. Parse action, apply to galaxy
   e. Save new state + memory to Turso
3. Generate events (market shifts, rumors, patrol sightings)
```

**Scheduling options:**
- Vercel Cron, GitHub Actions cron, or a simple `setInterval` on the server
- Pi extension can trigger NPC turns when player logs in (lazy mode)

---

## Multiplayer Possibilities

With Turso as shared backend:

| Mode | Description |
|------|-------------|
| **Solo + LLM NPCs** | Player has private galaxy, LLM NPCs fill the world |
| **Shared galaxy (async)** | Multiple players, turns happen via API or Telnet |
| **Telnet BBS** | Modern BBS running the game server, players dial in |
| **Web client** | Browser-based interface to the same shared galaxy |
| **Pi extension as client** | Connect pi extension to shared server instead of local mode |

**The sweet spot:** Pi extension as *the* way to play, Turso as shared state, LLM NPCs as always-present competitors. Players who want more can join via web or Telnet.

---

## Realistic Feature Scope

### Faithful Elements (Easily achievable)

- ✅ Galaxy map with sectors, jump gates, sectors connected in a network
- ✅ Resource trading (ore, organics, equipment) at ports
- ✅ Ship upgrades (engines, weapons, shields, cargo)
- ✅ Combat with NPCs (LLM-driven Ferrengi raiders, pirates, patrol)
- ✅ ANSI art for welcome screens, ship displays, sector art
- ✅ Text descriptions for sectors/planets with flavor
- ✅ FedSpace safe zone for new players
- ✅ The StarDock as a hub
- ✅ Turn-based command interface

### LLM-Enhanced (Novel and achievable)

- ✅ Dynamic sector descriptions generated by LLM
- ✅ NPC traders with reasoning-based decisions
- ✅ Raider AI that assesses risk/reward before attacking
- ✅ Corporation AI that debates, votes, and betrays organically
- ✅ News feed with LLM-generated rumors and events
- ✅ Character voice — each NPC has a distinct persona

### Ambiguous (Depends on effort)

- ⚠️ Corporation system — AI members simulate real social dynamics
- ⚠️ Leaderboards — persisted in Turso
- ⚠️ Shared galaxy with other human players
- ⚠️ "Movies" (animated ANSI sequences) — doable but complex

### Hard/Unlikely

- ❌ **Real-time live multiplayer** — WebSocket-based, concurrent human interactions. Out of scope for now.
- ❌ Eve Online-scale anything
- ❌ MMO-level concurrent players

---

## Hosting Options

Three tiers of deployment, from free/hobby to production:

### Option 1: Home Docker ($0)

Run the game server in Docker on any machine on your home network.

```bash
docker run -p 8080:8080 \
  -v cloudwars-data:/app/data \
  your/cloudwars-server:latest
```

**Pros:**
- Zero cost (just uses your home bandwidth)
- Private — you and your kids only
- Full control, easy to iterate
- SQLite or Turso local mode for persistence

**Cons:**
- Not accessible from outside your home network by default
- Machine must stay on

#### Making it public: Cloudflare Tunnel

No router config, no static IP, no dynamic DNS. Install `cloudflared` once and point it at your local server:


```bash
# Install once
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared

# Expose your home server to a permanent public URL
cloudflared tunnel --url http://localhost:8080
```

You'll get a URL like `https://random-name.trycloudflare.com`. Share it, and friends join your galaxy.


**Pros of tunneling:**
- Zero config, free, works behind NAT
- Perfect for sharing with a few friends
- No cloud hosting costs

**Cons:**
- Your home IP/bandwidth used by others
- Tunnel URL changes each restart (or pay for a permanent tunnel)
- Cloudflare sees traffic

### Option 2: Cloudflare (Free Tier, Global)


Cloudflare offers several free-tier services that combine well for a turn-based game:

#### Cloudflare Workers (API Layer)
- **Free:** 100,000 requests/day, 10ms CPU time/request
- **HTTP only** — no WebSocket, but perfect for turn-based APIs
- Deploy game logic as serverless functions

#### Cloudflare D1 (SQLite Persistence)
- **Free:** 5 GB storage, 5 million reads/month, 100,000 writes/month
- SQLite at the edge — familiar SQL, globally replicated
- **D1 is async and HTTP-based** — fits the turn-based model exactly
- Alternative to Turso for zero cost

#### Cloudflare Cron Triggers (NPC Brain Scheduler)
- **Free:** 1 cron trigger per worker, minimum 25-minute interval
- Schedule NPC turns to run every 25 minutes (free tier limit)
- NPC brain logic in a Worker, triggered by cron

#### Cloudflare Durable Objects (Optional State)
- **Free:** 100,000 requests/day, 50 active objects
- Stateful in-memory objects with WebSocket support
- Could host a "live game session" DO for real-time features later
- More complex; start with D1 first

**Architecture on Cloudflare:**
```
Cloudflare Workers (API) → Cloudflare D1 (SQLite) → Cron Trigger (NPC Brain)
```

**Pros:**
- Free tier is generous for a hobby project
- Global edge = low latency worldwide
- D1 = SQLite, no schema migration complexity
- Built-in CDN, DDoS protection, SSL
- Easy to scale later

**Cons:**
- No native WebSocket in free tier (D1 is HTTP-only)
- D1 write limit: ~3,600 writes/hour (one NPC action ≈ one write)
- 25-minute minimum cron interval (not 15)
- Cold starts on Workers (mitigated by keeping one DO warm)


**Good fit for:** Async multiplayer, turn-based APIs, LLM-driven NPCs on a budget.


### Option 3: Traditional VPS ($5–20/month)

Standard cloud hosting for when you need more power or WebSocket support.


| Provider | Price | Notes |
|----------|-------|-------|
| **Railway** | ~$5/month | Simple deploy, pays per usage |
| **Render** | ~$7/month | Free tier available, easy Node.js deploy |
| **DigitalOcean** | $4–6/month | Droplet, full control |
| **Hetzner** | ~€4/month | EU-based, great value |
| **Oracle Free Tier** | Free forever | Always-free ARM VM, 1TB bandwidth |

**Pros:**
- Full WebSocket support if you want real-time later
- No write limits like D1
- Full Linux environment
- Standard Node.js/Bun deployment

**Cons:**
- Costs money (even if cheap)
- You're managing a server again

**Best for:** When the free tier is too limiting, or you want WebSocket multiplayer eventually.

### Summary Table

| Option | Cost | WebSocket | Write Limits | Best For |
|--------|------|----------|--------------|----------|
| **Home Docker** | Free | ❌ | None | You + kids, private |
| **Cloudflare Free** | Free | ❌ | ~100k/day | Global async, hobby scale |
| **VPS** | $5–20/mo | ✅ | None | Production, real-time later |

**Recommendation:** Start with Home Docker for iteration. Move to Cloudflare D1 when you want a public URL and shared state. Upgrade to VPS if you hit limits or want WebSocket later.


---

## Honest Assessment

**This is a better project than a static TW2002 clone** — it's actually *novel*. Most TW2002 clones reimplement mechanics. This adds an AI layer that makes the universe feel responsive, alive, and different every time.

**The risks are real but manageable:**
- Start with 1-2 NPCs, not a full galaxy simulation
- Use the same model pi uses (no extra API keys needed)
- Constrain NPC decisions to game-legal actions
- Give each NPC a system prompt persona that persists across sessions

**You're not getting too crazy** — this is a coherent architecture:
- Pi extension = the interface layer (how you play)
- Turso = the persistence layer (shared state for NPCs + players)
- Cron/NPC Brain = the simulation layer (galaxy evolves)
- LLM = the intelligence layer (NPCs reason)

The question is how far you want to go. You could start with just the pi extension (single-player, local state) and add the server/NPC Brain layer later.

---

## Phases (TBD)

**Phase 1: Pi Extension MVP**
- Single-player, session-based state
- Basic galaxy generation
- LLM-driven NPC (one trader, one raider)
- Simple TUI with ANSI art
- Player acts via custom tool calls

**Phase 2: LLM Galaxy Simulation**
- Multiple NPCs with distinct personas
- NPC Brain runs on player login (lazy mode)
- Session-based persistence

**Phase 3: Shared Backend**
- Turso SQLite for persistent shared state
- NPC Brain scheduler (cron)
- Player profiles, leaderboards
- Optional: other clients (web, Telnet)

**Phase 4: Multiplayer**
- Other humans join the shared galaxy
- Pi extension as premium client
- Competition and cooperation with humans + LLM NPCs

---

## Related

- [[Trade Wars 2002]] — game history and mechanics
- [[BBS Era Overview]] — ANSI art, door games, FidoNet
- [[Pi Extensions]] — TUI documentation
- [[Pi Snake Example]] — reference implementation
- [[Turso]] — cloud SQLite
- [[LLM Agents]] — pattern for NPC brain
