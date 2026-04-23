# TW 3002 CLI

A terminal-native space trading game — a spiritual successor to Trade Wars 2002.

## Quick Start

```bash
cd cli
bun install
bun run dev
```

Or build the standalone binary (~103MB, no runtime needed):

```bash
bun run build
./tw3002
```

## How to Play

1. **Launch** — `bun run dev` or `./tw3002`
2. **New Game** — Choose a galaxy slot (A, B, or C)
3. **Name Your Ship** — Pick a callsign
4. **Choose Class** — Merchant (cargo), Scout (turns), or Interceptor (combat)
5. **Navigate** — Use ↑↓ to select sectors, Enter to jump
6. **Trade** — Press **M** at ports to buy low, sell high
7. **Fight** — Dangerous sectors may have pirates! Attack, flee, or bribe
8. **Upgrade** — Find a **StarDock** (press **D**) to buy ship improvements
9. **Save** — Your progress auto-saves; resume anytime via **Continue**

## Controls

| Key | Action |
|-----|--------|
| ↑↓←→ | Navigate / Select |
| Enter | Confirm / Jump |
| Esc | Back / Cancel |
| M | Open Market (at ports) |
| D | Enter StarDock |
| Q | Quit |

## Features

- 🌌 **Procedurally generated galaxies** — 100–1000 sectors per game
- 💰 **Supply/demand economy** — Prices shift as you trade
- ⚔️ **Turn-based combat** — Fight, flee, or bribe pirates
- 🚀 **3 ship classes + 15 upgrades** — Customize your vessel
- 💾 **3-slot save system** — Run multiple independent galaxies
- 🎨 **BBS-era terminal aesthetic** — Box-drawing UI, authentic feel
- 📊 **Net worth tracking** — Climb from Space Peasant to Galactic Tycoon

## Keyboard Reference

### Sector View
- ↑↓ — Select connected sector
- Enter — Jump (costs 1 turn)
- M — Market (if port present)
- D — StarDock (if present)
- Q — Quit

### Market
- ↑↓ — Select commodity
- B — Buy mode
- S — Sell mode
- ←→ — Adjust quantity
- Enter — Confirm trade
- Esc — Back to sector

### Combat
- A — Attack
- F — Flee (shows success chance)
- B — Bribe (shows cost)
- Enter — Confirm selected action

### StarDock
- ↑↓ — Select upgrade
- Enter — Purchase
- Esc — Leave

## Balance Notes

- Profitable trade routes: 3–5 jumps, 20–50% margin
- Merchant starts with 120 cargo; Scout with 120 turns; Interceptor with 120 hull
- Shield regenerates on every jump (first-hit buffer)
- Hull only repairs at StarDock or on respawn
- Combat in dangerous sectors (~30% chance); safe sectors are peaceful

## Known Limitations

- No NPCs yet (enemy pirates are procedurally generated, not persistent)
- No turn regeneration (plan: 1 turn per real hour in a future update)
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
