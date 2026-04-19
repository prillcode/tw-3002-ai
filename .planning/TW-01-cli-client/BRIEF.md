# TW-01: CLI Client (Ink + Bun)

## Work Identity
- **ID:** TW-01
- **Type:** Feature
- **Scope:** CLI Binary + TUI Infrastructure

## Objective
Build the primary game interface: a terminal-native CLI using Ink (React for terminals) and Bun runtime. This is the player's window into the galaxy — rich ANSI art, keyboard navigation, and responsive TUI components.

## In Scope
- Bun project setup with TypeScript
- Ink framework integration
- ANSI art welcome screen and ship displays
- Keyboard navigation (arrows, enter, escape, hotkeys)
- Sector view with ASCII galaxy map
- Status panels (credits, cargo, ship stats)
- Market/trading interface screens
- Local SQLite integration (`bun:sqlite`)
- CLI distribution setup (npm/brew prep)

## Out of Scope
- Game logic implementation (TW-02)
- LLM NPC integration (TW-03)
- Cloud deployment (TW-04)
- Web client (secondary, TW-04)
- Authentication system (TW-04)

## Success Criteria
1. Player can launch CLI: `bun run dev` or `tw3002 play`
2. Welcome screen displays with ANSI art
3. Keyboard navigation works (move between screens)
4. Sector view shows ship location and nearby sectors
5. Ship status panel shows credits, cargo, fuel
6. Can navigate: Welcome → Sector → Market → Back
7. State persists to local SQLite between sessions

## Dependencies
- Blocked by: None (can start immediately)
- Blocks: TW-02 (game engine needs UI to display)
- Related: TW-04 (packaging comes later)

## References
- PRD: `docs/TW3002-PRD.md` Section 5.1
- Ink: https://github.com/vadimdemedes/ink
- Bun: https://bun.sh/
