# TW 3002 CLI

A terminal-native space trading game — a spiritual successor to Trade Wars 2002.

## Install

### From Source

```bash
cd cli
bun install
bun run build
./tw3002
```

### From npm

```bash
npm install -g tw3002
tw3002
```

**Linux:** The npm package includes a pre-built binary (~100MB). No runtime needed.

**macOS / Windows:** The npm package includes a wrapper script. If the binary isn't available for your platform, run:
```bash
tw3002 --build
```
This requires [Bun](https://bun.sh) to compile from source.

For platform-specific pre-built binaries, see [GitHub Releases](https://github.com/prillcode/tw-3002-ai/releases).

## How to Play

1. **Launch** — `bun run dev` or `./tw3002`
2. **New Game** — Choose a galaxy slot (A, B, or C) and size (100–1,000 sectors)
3. **Name Your Ship** — Pick a callsign
4. **Choose Class** — Merchant (cargo), Scout (turns), or Interceptor (combat)
5. **Navigate** — Use ↑↓ to select sectors, Enter to jump
6. **Trade** — Press **M** at ports to buy low, sell high
7. **Fight** — Dangerous sectors may have pirates or NPC raiders! Attack, flee, or bribe
8. **Upgrade** — Find a **StarDock** (press **D**) to buy ship improvements
9. **Track** — Press **N** to view your Navigation Log
10. **Save** — Your progress auto-saves; resume anytime via **Continue**

> **NPCs evolve while you're away.** Every time you log in, nearby NPCs take their turns — trading, fighting, and moving. Check the news ticker to see what happened.

## Controls

| Key | Action |
|-----|--------|
| ↑↓←→ | Navigate / Select |
| Enter | Confirm / Jump |
| Esc | Back / Cancel |
| M | Open Market (at ports) |
| D | Enter StarDock |
| N | Navigation Log |
| H | Help screen |
| Q | Quit |

### Sector View
- ↑↓ — Select connected sector
- Enter — Jump (costs 1 turn)
- M — Market (if port present)
- D — StarDock (if present)
- N — Navigation Log
- H — Help
- Q — Quit

### Market
- ↑↓ — Select commodity
- B — Buy mode
- S — Sell mode
- ←→ — Adjust quantity
- T — Max quantity
- Enter — Confirm trade
- H — Help
- Esc — Back to sector

### Combat
- ↑↓ — Select action (Attack / Flee / Bribe)
- Enter — Confirm selected action
- H — Help

### StarDock
- ↑↓ — Select upgrade
- Enter — Purchase
- H — Help
- Esc — Leave

### Navigation Log
- N or Esc — Return to sector

### Help Screen
- H or Esc — Close help

## Features

- 🌌 **Procedurally generated galaxies** — 100–1,000 sectors per game
- 💰 **Supply/demand economy** — Prices shift as NPCs and players trade
- ⚔️ **Turn-based combat** — Fight, flee, or bribe pirates and NPC raiders
- 🧠 **20+ persistent NPCs per galaxy** — Traders, raiders, patrols with memory and reputation
- 🚀 **3 ship classes + 15 upgrades** — Customize your vessel
- 💾 **3-slot save system** — Run multiple independent galaxies
- 🎨 **BBS-era terminal aesthetic** — Box-drawing UI, authentic feel
- 📊 **Net worth tracking** — Climb from Space Peasant to Galactic Tycoon
- 🤖 **Optional LLM-driven NPCs** — Via Ollama (local, free) or OpenRouter (cloud, cheap)
- 📰 **Galaxy news ticker** — Track NPC movements, fights, and market events
- 📍 **Navigation Log** — Breadcrumb trail of visited sectors with blast markers on death
- 📐 **Responsive layout** — Adapts to terminal width (wide ≥100 cols vs narrow)
- 💥 **Auto-save on Ctrl+C** — Graceful exit with save

## Balance Notes

- Profitable trade routes: 3–5 jumps, 20–50% margin
- Merchant starts with 120 cargo; Scout with 120 turns; Interceptor with 120 hull
- Shield regenerates on every jump (first-hit buffer)
- Hull only repairs at StarDock or on respawn
- Combat in dangerous sectors (~30% chance); safe sectors are peaceful
- Death penalty: respawn in FedSpace with 90% credits, cargo lost

## Known Limitations

- NPCs only evolve on login (frozen during a play session)
- No turn regeneration yet (plan: 1 turn per real hour in a future update)
- No multiplayer (cloud mode planned for TW-04)
- No missions or storyline

## Tech Stack

- **Bun** — Runtime + bundler
- **Ink** — React for terminals
- **React** — Component model
- **TypeScript** — Type safety
- **bun:sqlite** — Local save database

## Requirements

- Bun 1.0+ (for development)
- Or just the compiled binary (no dependencies)

## Save Location

```
~/.tw3002/saves.db
```

Delete this file to reset all progress.

## Config Location

```
~/.tw3002/config.json
```

Optional LLM provider configuration. See [GAME_GUIDE.md](../GAME_GUIDE.md) for examples.

## License

MIT
