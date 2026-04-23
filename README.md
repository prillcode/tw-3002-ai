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
- Generate and explore 100–1000 sector galaxies
- Trade commodities at ports (supply/demand pricing)
- Fight, flee, or bribe pirates in dangerous sectors
- Upgrade your ship at StarDocks
- Save and resume across 3 independent galaxy slots

## Documentation

- **[Product Requirements Document](./docs/TW3002-PRD.md)** — Architecture and design decisions
- **[CLI README](./cli/README.md)** — Install, controls, and gameplay guide
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
| TW-01 CLI Client | ~90% | Terminal UI, screens, save/load — Phase 7 (packaging) remaining |
| TW-02 Game Engine | ~85% | Galaxy gen, economy, combat, ships — Integration complete |
| TW-03 NPC Brain | 0% | LLM-driven NPCs — ready to start |
| TW-04 Cloud Infra | 0% | Cloudflare Workers, auth, shared galaxies |

## Tech Stack

| Layer | Choice |
|-------|--------|
| Client | Ink (React for terminals) + Bun |
| Game Engine | `@tw3002/engine` monorepo package |
| Local Persistence | `bun:sqlite` (3 save slots) |
| Cloud Persistence | Cloudflare D1 (planned) |
| NPC Brain | OpenRouter → GPT-4o-mini / Claude Haiku (planned) |
| Server | Cloudflare Workers (planned) |

## License

Not yet decided.
