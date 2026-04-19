# TW-02: Game Engine

## Work Identity
- **ID:** TW-02
- **Type:** Feature
- **Scope:** Core Game Logic & Rules

## Objective
Implement the Trade Wars 2002 game mechanics: galaxy generation, trading economy, ship upgrades, and combat system. This is the "brain" of the game — rules, state transitions, and win conditions.

## In Scope
- Galaxy generation (sectors, connections, port types)
- Economy model (supply/demand, price fluctuation)
- Trading system (buy/sell, cargo limits, profit calculation)
- Ship systems (engines, weapons, shields, cargo holds)
- Combat mechanics (flee, fight, damage calculation)
- FedSpace safe zones
- StarDock (upgrades and banking)
- Game state management
- Event system (news, rumors)

## Out of Scope
- TUI/CLI implementation (TW-01 handles display)
- LLM NPC behavior (TW-03 handles NPC brains)
- Cloud persistence (TW-04 handles D1 migration)
- Multiplayer sync (TW-04 handles shared state)
- Web client (TW-04)

## Success Criteria
1. Can generate a 100-sector galaxy with varied ports
2. Player can buy low, sell high, and profit
3. Ship upgrades affect cargo capacity, speed, combat
4. Combat resolves with damage/hull calculations
5. FedSpace protects new players from combat
6. Game state validates all actions (no cheating)
7. Economy feels "alive" (prices vary by location)

## Dependencies
- Blocked by: TW-01 Phase 3+ (needs UI to display game state)
- Blocks: TW-03 (NPCs need game logic to interact with)
- Related: TW-04 (rules work the same locally or cloud)

## References
- PRD: `docs/TW3002-PRD.md` Section 4 (Game Mechanics)
- Feasibility: `docs/tw-3002-ai-feasibility.md` TW2002 mechanics reference
