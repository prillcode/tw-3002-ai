# TW 3002 AI

A spiritual successor to Trade Wars 2002 — the classic BBS-era space trading and combat game — reimagined with LLM-driven NPCs that make the galaxy feel alive.

## Play Now

**[→ Launch Web Client](https://portal.playtradewars.net)**

No install. Register with email, verify, pick a ship, and enter a shared galaxy of 1,000 sectors.

## What

- Turn-based space trading and combat in a procedurally generated galaxy
- NPC traders, raiders, and factions powered by LLM reasoning — not static rules
- Cloud multiplayer via Cloudflare Workers + D1
- Daily bounties, leaderboards, player profiles
- Planets & colonization with citadel advancement
- Fighter & mine deployment for sector defense
- Web client with terminal aesthetic — keyboard shortcuts + mouse

## Current Status

**Cloud multiplayer v0.6.5 is live.** You can:
- Register and verify your email
- Join a shared galaxy with other players
- Trade commodities at ports with dynamic supply/demand pricing
- Fight, flee, or bribe pirates and NPCs
- Upgrade your ship at StarDocks (cargo, shields, weapons, hull)
- Claim and colonize planets for passive income
- Deploy fighters and mines to defend sectors
- Track daily bounties for credit rewards
- Climb the leaderboard (Net Worth, Kills, Planets, Experience)
- Build reputation with factions (CHOAM, Fremen, Sardaukar)
- Earn Guild Commission at +1000 alignment

## Documentation

- **[Player Guide](https://playtradewars.net/guide/getting-started)** — Getting started, trading, combat, StarDock, keyboard reference
- **[API Docs](https://playtradewars.net/api)** — OpenAPI reference, rate limits, authentication, tutorials
- **[Product Requirements Document](./docs/TW3002-PRD.md)** — Architecture and design decisions
- **[Original Feasibility Study](./docs/tw-3002-ai-feasibility.md)** — Concept exploration

## Project Roadmap

| Work Item | Status | Description |
|-----------|--------|-------------|
| TW-01 CLI Client | 🕸️ Legacy | Terminal UI — superseded by web client |
| TW-02 Game Engine | ✅ Complete | Galaxy gen, economy, combat, ship upgrades |
| TW-03 NPC Brain | ✅ Complete | Rule-based + LLM hybrid, memory, reputation |
| TW-04 Cloud Infra | ✅ Complete | Cloudflare Workers, D1, auth, shared galaxies |
| TW-05 PvP Update | ✅ Complete | Player combat, kills, bounty board |
| TW-06 Cloud Gameplay | ✅ Complete | Fighters, mines, blockades, planets, Q-cannons |
| TW-07 Polish | ✅ Complete | Balance, tuning, feedback loops |
| TW-08 Navigation | ✅ Complete | Navigation log, help screen, leaderboard |
| TW-09 Engine Polish | ✅ Complete | UI refinements, sector view, market |
| TW-10 Web Client | ✅ Complete | Vue 3 + Vite game client, login, ship creation |
| TW-11 Email & Auth | ✅ Complete | Email verification, anti-spam, Turnstile |
| TW-12 API & Rate Limits | ✅ Complete | Scalar docs, rate limiting, action budgets |
| TW-13 Fighters & Mines | ✅ Complete | Deployment, recall, layered defenses |
| TW-14 Planets & Citadels | ✅ Complete | Genesis torpedo, colonization, production |
| TW-15 Alignment | ✅ Complete | Faction standing, Guild commission |
| TW-16 Comm & Event Log | ✅ Complete | In-game news, NPC dialogue, event feed |
| TW-17 Combat Depth | ✅ Complete | Insurance, defeat pipeline, wanted system |
| TW-18 Melange & Factions | ✅ Complete | Faction-specific NPC behaviors |
| TW-19 Leaderboards & Bounties | ✅ Complete | Daily missions, leaderboard enhancements |

## Tech Stack

| Layer | Choice |
|-------|--------|
| Web Client | Vue 3 + Vite + Tailwind CSS |
| Game Engine | `@tw3002/engine` monorepo package |
| Cloud API | Cloudflare Workers + D1 |
| Auth | Email + OTP + bearer tokens |
| NPC Brain | Cloudflare Workers AI (GLM-4.7-flash, Qwen3-30B) |
| Email | Resend |
| Docs Site | Astro + Cloudflare Pages |

## License

MIT
