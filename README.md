# TW 3002 AI

A spiritual successor to Trade Wars 2002 — the classic BBS-era space trading and combat game — reimagined with LLM-driven NPCs that make the galaxy feel alive.

## What

- Turn-based space trading and combat in a procedurally generated galaxy
- NPC traders, raiders, and factions powered by LLM reasoning — not static rules
- Terminal-native TUI client with authentic BBS aesthetic
- Cloudflare Workers + D1 for free-tier hosting
- Docker option for local/home network play

## Current Status

**Local single-player MVP is playable.** You can:
- Generate and explore 100–1,000 sector galaxies
- Trade commodities at ports with dynamic supply/demand pricing
- Fight, flee, or bribe pirates in dangerous sectors
- Upgrade your ship at StarDocks (cargo, shields, weapons, hull)
- Save and resume across 3 independent galaxy slots
- Encounter 20+ NPCs per galaxy (traders, raiders, patrols) that move, trade, and fight
- Build reputation with NPCs — they remember you, hold grudges, and form alliances
- Optional LLM-driven NPCs via Ollama (local) or OpenRouter (cloud)

## Documentation

- **[GAME_GUIDE.md](./GAME_GUIDE.md)** — Complete player guide: trading, combat, strategy, keyboard reference
- **[OPENROUTER-SETUP.md](./OPENROUTER-SETUP.md)** — How to enable cloud LLM providers for NPCs
- **[Product Requirements Document](./docs/TW3002-PRD.md)** — Architecture and design decisions
- **[CLI README](./cli/README.md)** — Install, controls, and technical details
- **[Original Feasibility Study](./docs/tw-3002-ai-feasibility.md)** — Concept exploration

## Quick Start

```bash
cd cli
bun install
bun run dev
```

Or build the standalone binary:

```bash
cd cli
bun run build
./tw3002
```

## Project Roadmap

| Work Item | Status | Description |
|-----------|--------|-------------|
| TW-01 CLI Client | ~95% | Terminal UI, screens, save/load, combat, market, StarDock — packaging polish remaining |
| TW-02 Game Engine | ~90% | Galaxy gen, economy, combat system, ship upgrades, state manager — complete |
| TW-03 NPC Brain | ~70% | Rule-based + LLM hybrid brain, memory, reputation, caching, galaxy evolution — balance tuning remaining |
| TW-04 Cloud Infra | 0% | Cloudflare Workers, auth, shared galaxies — not started |

## Tech Stack

| Layer | Choice |
|-------|--------|
| Client | Ink (React for terminals) + Bun |
| Game Engine | `@tw3002/engine` monorepo package |
| Local Persistence | `bun:sqlite` (3 save slots) |
| Cloud Persistence | Cloudflare D1 (planned) |
| NPC Brain | Rule-based default; optional Ollama / OpenRouter / Mock LLM providers |
| Server | Cloudflare Workers (planned) |

## License

Not yet decided.
