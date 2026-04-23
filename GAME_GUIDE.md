# TW 3002 AI — Player's Guide

*A spiritual successor to Trade Wars 2002. Explore. Trade. Fight. Survive.*

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Your First Game](#your-first-game)
3. [The Sector Screen](#the-sector-screen)
4. [Navigation & Turns](#navigation--turns)
5. [Trading](#trading)
6. [Combat](#combat)
7. [StarDock & Upgrades](#stardock--upgrades)
8. [NPCs & Reputation](#npcs--reputation)
9. [Galaxy News](#galaxy-news)
10. [Strategy Tips](#strategy-tips)
11. [Keyboard Reference](#keyboard-reference)
12. [Local CLI Gameplay](#local-cli-gameplay)
13. [Multiplayer Cloud Gameplay](#multiplayer-cloud-gameplay) *(coming soon)*

---

## Getting Started

### Installation

```bash
# Clone the repo
git clone <repo-url>
cd tw-3002-ai/cli

# Build the binary
bun install
bun run build

# Run the game
./tw3002
```

> **Tip:** The binary is self-contained (~100MB). You can copy `tw3002` anywhere and run it.

### System Requirements

- **OS:** Linux, macOS, or WSL on Windows
- **Runtime:** None (compiled binary)
- **Display:** Terminal with 80×24 minimum
- **Optional:** An LLM provider if you want smarter NPCs — Ollama (local, free) or OpenRouter (cloud, API key). See [LLM Modes](#llm-modes-optional).

---

## Your First Game

When you launch the game, you'll see the **Welcome Screen**:

```
╔══════════════════════════════════════════════╗
║         TW 3002 AI                           ║
║   Terminal Space Trading & Combat            ║
╚══════════════════════════════════════════════╝

  [↑↓] Navigate  [Enter] Select  [Q] Quit

  > New Game
    Continue
    Quit
```

### 1. Choose New Game

### 2. Pick a Save Slot

Three slots: **Galaxy A**, **Galaxy B**, **Galaxy C**. Each is an independent universe.

### 3. Choose Galaxy Size

| Size | Sectors | Best For |
|------|---------|----------|
| Small | 100 | Quick sessions, tight trading routes |
| Medium | 500 | More exploration, longer trade loops |
| Large | 1,000 | Deep space, epic exploration (~2s to generate) |

### 4. Name Your Ship

Type a name and press **Enter**.

### 5. Choose a Ship Class

| Class | Strength | Weakness | Best For |
|-------|----------|----------|----------|
| **Merchant Vessel** | 120 cargo holds | Weak hull, no shields | Trading, making credits |
| **Scout Ship** | 120 turns/day | Tiny cargo (60) | Exploration, reaching far sectors |
| **Interceptor** | Tough hull (120) | Small cargo (70) | Combat, fighting pirates |

> **Beginner tip:** Start with a **Merchant Vessel**. Trading is the safest way to build wealth.

---

## The Sector Screen

This is where you'll spend 90% of your time. The screen has four regions:

```
┌─────────────────────────────────────────────────────────────┐
│ SECTOR 0 — Sol Prime (safe)  [FedSpace]                     │
│ Port: Terra Station (Class 1)                               │
├─────────────────────────────────────────────────────────────┤
│ Warp Lanes        │  [Map]        │  Ship: Starfox          │
│ → Sector 1        │     *         │  Credits: 5,000         │
│ → Sector 2        │    /|\        │  Cargo: 0/120           │
│ → Sector 3        │   / | \       │  Hull: 100/100          │
│                   │  1  2  3      │  Shield: 0/0            │
│                   │               │  Turns: 80/80           │
│                   │               │  Net Worth: 5,000       │
├─────────────────────────────────────────────────────────────┤
│ Selected: Sector 1 — Proxima (safe) — [Enter] to Jump       │
├─────────────────────────────────────────────────────────────┤
│ 📦 Kira the Trader — trader                                 │
│ 📰 Galaxy News:                                             │
│   • Welcome to a new galaxy, Commander!                     │
└─────────────────────────────────────────────────────────────┘
```

### Reading the Map

- `*` = your current sector
- Numbers = connected sectors you can jump to
- `[FedSpace]` = safe zone (no random pirates)

---

## Navigation & Turns

### Moving Between Sectors

- **↑ / ↓** — Select a warp lane
- **Enter** — Jump to selected sector (costs **1 turn**)

Your **shield regenerates fully** after each jump. Use this to your advantage.

### Turns

- You start with a fixed number of turns per "day" (80 for Merchants, 120 for Scouts)
- Each jump costs 1 turn
- Running out of turns **strands you** in place until they regenerate

> **⚠ Warning:** When turns drop below 20, a yellow warning appears. Plan your route home!

### Danger Levels

| Level | Color | Meaning |
|-------|-------|---------|
| **Safe** | Green | FedSpace patrols. No random encounters. |
| **Frontier** | Yellow | Occasional pirates. Moderate risk. |
| **Dangerous** | Red | High pirate activity. Enter prepared. |

---

## Trading

Trading is the backbone of the economy. Buy low, sell high, get rich.

### Commodities

| Commodity | Base Price | Volatility | Best Strategy |
|-----------|------------|------------|---------------|
| **Ore** | ~100 | Low | Steady, reliable profits |
| **Organics** | ~50 | Medium | Good for quick flips |
| **Equipment** | ~200 | High | High risk, high reward |

### Port Classes

Ports specialize in buying and selling:

| Port Class | Sells (cheap) | Buys (expensive) |
|------------|---------------|------------------|
| **Class 1** | Ore | Organics, Equipment |
| **Class 2** | Organics | Ore, Equipment |
| **Class 3** | Equipment | Ore, Organics |
| **Special** | Mixed | Mixed (check prices!) |

### How to Trade

1. Land in a sector with a port (shown in sector info)
2. Press **M** to open the Market
3. **↑ / ↓** to select a commodity
4. **B** to buy or **S** to sell
5. Enter quantity (or press **T** to max out)

> **Pro tip:** Port prices change based on supply. If a port is sold out of ore, its buy price goes **up**. Watch for shortages!

### Cargo Capacity

Your ship has a maximum cargo hold. If you try to buy beyond capacity, the trade is rejected.

---

## Combat

Sometimes you can't avoid a fight.

### Random Encounters

When jumping into a sector, you may encounter:
- **Pirate Scout** — weak, easy money
- **Marauder** — moderate threat
- **Dreadnought** — run or die

### NPC Raiders

Some NPCs in the galaxy are **raiders** (shown in red on the sector screen). If you jump into their sector, they may attack.

### Combat Options

```
╔════════════════════════════════════════╗
║  ⚔ COMBAT — Pirate Scout               ║
║                                        ║
║  Your Hull:  100/100  Shield: 0/0      ║
║  Enemy Hull:  60/60   Shield: 0/0      ║
║                                        ║
║  [↑↓] Select  [Enter] Confirm          ║
║                                        ║
║  > Attack (5 dmg)                      ║
║    Flee (43% chance)                   ║
║    Bribe (250 credits)                 ║
╚════════════════════════════════════════╝
```

| Action | Risk | Reward |
|--------|------|--------|
| **Attack** | Take damage | Credits + loot |
| **Flee** | May fail, take damage | Escape safely |
| **Bribe** | Lose credits | Skip fight entirely |

### How Combat Works

1. Each round, both sides attack simultaneously
2. **Shield absorbs 50%** of incoming damage
3. Remaining damage hits **hull**
4. Hull reaches 0 = **destroyed**

### If You Die

Don't panic. You respawn at the nearest **FedSpace** sector with:
- Full hull and shield
- **90% of your credits** (10% penalty)
- All cargo lost

> **Hard truth:** Death is expensive. Flee when you're outmatched.

---

## StarDock & Upgrades

StarDocks are your safe harbors. Look for the **⚡ StarDock detected** message.

### What StarDocks Do

- **Repair hull** to full (free)
- **Recharge shield** to full (free)
- **Sell upgrades** (permanent ship improvements)

### Press **D** to Dock

### Upgrade Categories

| Category | Effect | Example |
|----------|--------|---------|
| **Cargo Holds** | +cargo capacity | Cargo Holds Mk I (+20) |
| **Shields** | +shield points | Shield Emitter Mk I (+15) |
| **Weapons** | +combat damage | Plasma Cannon Mk I (+3) |
| **Hull** | +max hull | Hull Plating Mk I (+20) |
| **Engines** | — | Future expansion |

### Upgrade Tiers

Each category has 3 tiers. You must buy **Mk I** before **Mk II**, and so on.

> **Strategy:** Early game, prioritize **Cargo Holds** (more trade profit) or **Shields** (survive combat). Late game, max out **Weapons** and **Hull**.

---

## NPCs & Reputation

The galaxy is alive with NPCs. They move, trade, fight, and **remember you**.

### NPC Types

| Type | Icon | Behavior |
|------|------|----------|
| **Trader** | 📦 | Buy/sell at ports. Mostly harmless. |
| **Raider** | ⚠️ | Will attack if aggressive enough. |
| **Patrol** | 🛡️ | Protects FedSpace. Attacks raiders. |

### Reputation System

Your actions affect how NPCs feel about you:

| Score | Status | Effect |
|-------|--------|--------|
| **+30 or higher** | Friendly | Won't attack, may offer better deals |
| **-30 to +30** | Neutral | Normal behavior |
| **-30 or lower** | Hostile | Attacks on sight |
| **-60 or lower** | Hunted | Actively seeks you out |

### Building Reputation

- **Win fights** against raiders → other raiders fear you (+rep)
- **Die to a raider** → they feel dominant (+rep for them)
- **Trade fairly** near traders → traders like you (+rep)
- **Attack traders** → they hold grudges (-rep, broken alliances)

### NPC Memory

NPCs remember:
- **Grudges** — who defeated them (severity 1-10)
- **Alliances** — who traded fairly with them
- **Market observations** — price data from ports they've visited

Grudges fade over time. Old enemies may eventually forgive you.

> **Pro tip:** Don't attack traders who like you. Betrayal creates the deepest grudges.

### Galaxy Evolution

Every time you **log in**, the NPCs within 2 sectors of you take their turns:
- Traders move between ports and buy/sell
- Raiders prowl dangerous sectors and attack each other
- Patrols hunt pirates

The universe **evolves while you're away**. Prices shift, NPCs relocate, and power dynamics change.

---

## Galaxy News

The news ticker at the bottom of the sector screen shows recent events:

```
📰 Galaxy News:
  • Kira Voidwalker bought 10 ore at Terra Station
  • Iron Skull destroyed a merchant near Proxima
  • 2 new ships entered the galaxy
```

News helps you track:
- Where traders are moving (follow them to ports)
- Where raiders are active (avoid or hunt)
- Market disruptions (shortages create opportunities)

---

## Strategy Tips

### Early Game (0–50,000 credits)

1. **Stick to safe sectors** near FedSpace
2. **Buy cargo holds first** — more cargo = more profit per run
3. **Learn port patterns** — memorize which sectors have which port classes
4. **Avoid combat** — flee or bribe until you have shields and weapons

### Mid Game (50,000–200,000 credits)

1. **Equip shields** — they absorb 50% of damage, effectively doubling your survivability
2. **Map trade routes** — find a 3-sector loop: buy cheap → sell high → buy cheap → repeat
3. **Hunt weak pirates** — combat is profitable once you're strong enough
4. **Watch the news** — NPC movements reveal profitable opportunities

### Late Game (200,000+ credits)

1. **Max out your ship** — buy every upgrade
2. **Dominate trade** — your cargo holds should be 200+
3. **Clean out pirates** — hostile raiders are walking credit pinatas
4. **Explore the frontier** — dangerous sectors have the best port deals

### General Wisdom

- **Shields > Hull.** Shields regenerate on jump. Hull doesn't.
- **Turns are your real currency.** Don't waste them on bad trades.
- **Death costs 10%.** That's 20,000 credits if you have 200k. Be careful.
- **NPCs are predictable... mostly.** Raiders love dangerous space. Traders love ports.

---

## Keyboard Reference

### Global

| Key | Action |
|-----|--------|
| **↑ / ↓** | Navigate menus |
| **Enter** | Select / Confirm |
| **Esc** | Go back |
| **Q** | Quit (with confirmation) |

### Sector Screen

| Key | Action |
|-----|--------|
| **↑ / ↓ / ← / →** | Select warp lane |
| **Enter** | Jump to selected sector |
| **M** | Open Market (if port present) |
| **D** | Dock at StarDock (if present) |
| **Esc** | Return to main menu |
| **Q** | Quit game |

### Market Screen

| Key | Action |
|-----|--------|
| **↑ / ↓** | Select commodity |
| **B** | Buy mode |
| **S** | Sell mode |
| **← / →** | Adjust quantity |
| **T** | Max quantity |
| **Enter** | Confirm trade |
| **Esc** | Back to sector |

### Combat Screen

| Key | Action |
|-----|--------|
| **↑ / ↓** | Select action |
| **Enter** | Confirm |

### StarDock Screen

| Key | Action |
|-----|--------|
| **↑ / ↓** | Select upgrade |
| **Enter** | Purchase |
| **Esc** | Leave StarDock |

---

## Local CLI Gameplay

This is the current and default way to play TW 3002 AI.

### Single-Player Experience

The CLI client is a **single-player, terminal-based** game. You have 3 save slots, each with an independent galaxy. The game saves automatically whenever your state changes.

### Save Data Location

Saves are stored in:

```
~/.tw3002/saves.db
```

This is a SQLite database. You can back it up, copy it between machines, or delete it to start fresh.

### Config File

Optional configuration at:

```
~/.tw3002/config.json
```

Example:

```json
{
  "npcBrain": {
    "provider": "disabled",
    "model": "llama3.2:3b",
    "temperature": 0.7,
    "maxTokens": 256
  }
}
```

### LLM Modes (Optional)

By default, NPCs use **rule-based** decision making (fast, free, offline). You can optionally enable **LLM-driven NPCs** for more emergent, context-aware behavior.

| Provider | Cost | Speed | Best For |
|----------|------|-------|----------|
| **Disabled** (default) | Free | Instant | Reliable, predictable NPCs |
| **Ollama** (local) | Free | ~1–3s | Privacy-first, no internet needed |
| **OpenRouter** (cloud) | ~$0.01–0.05/session | ~0.5–2s | Access to GPT-4o, Claude, etc. |
| **Mock** (testing) | Free | Instant | Deterministic responses for debugging |

> **Note:** Each login processes ~10–15 active NPCs. With caching enabled, repeated situations skip the LLM call entirely.

#### Option A: Ollama (Local — Free, Private)

1. Install [Ollama](https://ollama.com):
   ```bash
   # macOS/Linux
   curl -fsSL https://ollama.com/install.sh | sh
   ```

2. Pull a lightweight model (3B parameters is plenty for NPC decisions):
   ```bash
   ollama pull llama3.2:3b
   ```

3. Ensure Ollama is running:
   ```bash
   ollama serve
   ```

4. Create `~/.tw3002/config.json`:
   ```json
   {
     "npcBrain": {
       "provider": "ollama",
       "model": "llama3.2:3b",
       "temperature": 0.7,
       "maxTokens": 256
     }
   }
   ```

5. Launch the game. NPCs will now query your local Ollama instance.

> **Tip:** Ollama runs on `http://localhost:11434` by default. If you run it on another machine, add `"endpoint": "http://your-host:11434"` to the config.

#### Option B: OpenRouter (Cloud — Pay-Per-Use)

1. Get a free API key from [openrouter.ai](https://openrouter.ai)

2. Create `~/.tw3002/config.json`:
   ```json
   {
     "npcBrain": {
       "provider": "openrouter",
       "apiKey": "sk-or-v1-...",
       "model": "openai/gpt-4o-mini",
       "temperature": 0.7,
       "maxTokens": 256
     }
   }
   ```

3. Launch the game. NPC decisions route through OpenRouter.

> **Cost estimate:** GPT-4o-mini at ~500 tokens × 15 NPCs ≈ $0.003–0.01 per session. With caching, expect 30–50% fewer calls.
>
> **Model recommendations:**
> - `openai/gpt-4o-mini` — best quality/cost ratio
> - `anthropic/claude-3-haiku` — fast, good at following instructions
> - `google/gemini-flash-1.5` — very cheap, decent quality

#### Option C: Mock Provider (Testing)

For debugging or deterministic behavior:

```json
{
  "npcBrain": {
    "provider": "mock"
  }
}
```

This returns canned responses per NPC type with zero network calls.

#### Coming Soon: Alternative LLM Backends

We are exploring integrations with **pi agent** and **opencode** as first-class providers. If you already use these tools, you'd be able to leverage their configured auth and models without managing a separate OpenRouter key.

| Backend | Status | Auth Source |
|---------|--------|-------------|
| **Pi Agent** | Planned | `~/.pi/agent/auth.json` (OAuth/API keys) |
| **OpenCode** | Planned | `~/.config/opencode/opencode.json` |

Both would read your existing credentials and model preferences, making the game feel like a natural extension of your existing agent toolchain. If you're interested in contributing these integrations, see the [Pi SDK docs](https://pi.dev/docs/sdk) or open an issue.

### Game Flow Summary

```
Launch → Welcome → Slot Select → Galaxy Size → Ship Name
                                                    ↓
              ← ← ← ← ← ← ← ← ← ← ← ← ← ← Ship Class
                ↓
            Sector Screen ← ← ← ← ← ← ← ← ← ← ← ← ← ←
                ↓                    ↑                  ↑
            Market / StarDock    Combat (if enemy)   Jump (costs turn)
                ↓                    ↓                  ↓
            Trade / Upgrade    Win / Flee / Die   New sector
```

### Known Limitations (Local CLI)

- No real-time multiplayer
- NPC ticks happen **once per login**, not continuously
- Galaxy size is fixed at generation time
- No player-to-player trading or combat

---

## Multiplayer Cloud Gameplay

*This section will be populated once TW-04 (Cloud Infrastructure) is implemented.*

Planned features:
- Persistent shared galaxy
- Real-time player presence
- Asynchronous NPC ticks
- Leaderboards and rankings
- Cross-device save sync

Stay tuned.

---

## Credits

TW 3002 AI is a spiritual successor to **Trade Wars 2002**, the legendary BBS door game by Gary Martin.

Built with ❤️ using Bun, Ink, and TypeScript.

*See you in the black, Commander.*
