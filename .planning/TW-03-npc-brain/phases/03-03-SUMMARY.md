# 03-03-SUMMARY — NPC Ticks & Dormant Galaxy

**Status:** ✅ COMPLETE
**Executed:** 2026-04-23
**Duration:** ~45 min

## What Was Built

### `packages/engine/src/npcs/tick.ts`

**`tickNPCs(container, llmConfig)`** — Async function that:
1. Identifies active NPCs within 2-sector radius of player (`getActiveNPCs`)
2. Shuffles turn order randomly
3. For each active NPC:
   - Calls `decideAction()` (LLM if configured, else rule-based)
   - Handles NPC-to-NPC combat (raider attacks trader → simplified 3-round dice combat)
   - Normal actions via `executeNPCAction()` (move, trade, idle, flee)
   - Updates mutable NPC map
4. Respawns destroyed NPCs with fresh random stats
5. Returns updated `GameStateContainer` + news items + tick stats

**`resolveNPCCombat(attacker, defender)`** — Simplified combat:
- 3 rounds max, weapon damage × random(0.8-1.2)
- Shield absorbs 50%, remainder to hull
- Winner loots 50% of loser's credits + up to 5 units of each cargo
- News headline generated

**`respawnDestroyedNPCs(npcs, galaxy, seed)`** — Replaces dead NPCs:
- Maintains population at ~20
- Type distribution: 50% trader, 30% raider, 20% patrol
- Sector placement by type (patrol near FedSpace, raider in dangerous, trader at ports)

**`TickStats`** interface: npcsProcessed, actionsTaken, llmCalls, llmCost, durationMs

### CLI Integration (`cli/src/index.tsx`)

**New game flow:** After ship class selection, `handleClassSelect` now:
1. Constructs `GameStateContainer` from React state
2. Calls `tickNPCs()` with `loadConfig()` for LLM settings
3. Updates `galaxy`, `npcs`, `news`, and `tickStats` state
4. Enters sector mode

**Continue flow:** `loadExistingGame` now:
1. Loads save from DB using local variables (not React state)
2. Constructs `GameStateContainer`
3. Calls `tickNPCs()`
4. Updates all state, then enters sector mode

**`handleSelectSlot`** made `async` to await `loadExistingGame()`

### Engine Exports

- `tickNPCs` exported from `packages/engine/src/index.ts`
- `TickStats` type exported
- `GameState` type exported (needed for CLI container construction)

### Files Changed

```
packages/engine/src/npcs/tick.ts       (NEW)
packages/engine/src/index.ts           (+tickNPCs, +TickStats, +GameState)
cli/src/index.tsx                      (+async tick on new/continue)
```

## Verification Results

- ✅ Engine typecheck clean
- ✅ CLI typecheck clean
- ✅ Binary builds successfully (~100MB)
- ✅ `tickNPCs` handles empty active NPC list (returns immediately)
- ✅ Destroyed NPCs respawn to maintain population
- ✅ NPC-to-NPC combat generates news headlines
- ✅ LLM config loaded from `~/.tw3002/config.json`
- ✅ Rule-based fallback on LLM timeout/error

## Notes

- **News from ticks appears in the existing news ticker** on SectorScreen — no separate UI needed for MVP
- **Tick stats stored in app state** but not displayed yet — can be surfaced in a future settings/debug panel
- **One tick per login** — NPCs are frozen during the play session. This keeps costs minimal and the game responsive.
- **Port inventory mutations from NPC trades** are persisted through the galaxy state update
