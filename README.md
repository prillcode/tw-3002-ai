# TW 3002 AI

A spiritual successor to Trade Wars 2002 — the classic BBS-era space trading and combat game — reimagined with LLM-driven NPCs that make the galaxy feel alive.

## What

- Turn-based space trading and combat in a procedurally generated galaxy
- NPC traders, raiders, and factions powered by LLM reasoning — not static rules
- TUI client via a Pi coding agent extension
- Cloudflare Workers + D1 for free-tier hosting at `galaxy3002`
- Docker option for local/home network play

## Documentation

- **[Product Requirements Document](./docs/TW3002-PRD.md)** — Authoritative spec with all architecture decisions
- **[Original Feasibility Study](./docs/tw-3002-ai-feasibility.md)** — Initial concept exploration

## Status

Early planning. Architecture finalized, ready for Phase 1 implementation.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Client | Pi extension (TUI + custom tool) |
| Server | Cloudflare Workers (or Docker) |
| Persistence | Cloudflare D1 / SQLite |
| NPC Brain | LLM calls via cron or on-login |
| Model | Pi's built-in model connectivity |

## License

Not yet decided.
