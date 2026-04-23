# 03-01-SUMMARY — NPC Brain Foundation

**Status:** ✅ COMPLETE
**Executed:** 2026-04-22
**Duration:** ~2 hours (estimated 2-3 hours)

## What Was Built

### Engine NPC Layer (`packages/engine/src/npcs/`)

**`types.ts`** — Full NPC type system:
- `NPC` with persona, ship (Combatant), cargo, memory, active state
- `NPCPersona` with aggression/caution/greed/loyalty + flavor text
- `NPCMemory` with lastActions, grudges, alliances, marketObservations
- `NPCAction` union: move, trade, attack, flee, idle
- `NewsItem` for galaxy news feed

**`generator.ts`** — `generateNPCs(galaxy, count, seed)`:
- 20 NPCs per galaxy by default
- Type distribution: 50% trader, 30% raider, 20% patrol
- Placement bias: patrols near FedSpace, raiders in dangerous sectors, traders at ports
- Procedural names (prefix + suffix), starting stats per type, small cargo for traders

**`brain.ts`** — Rule-based decision engine:
- `decideAction(npc, galaxy, players)` — trader/raider/patrol logic
- `executeNPCAction(npc, action, galaxy)` — applies action, mutates port inventory, returns news
- `npcToCombatant(npc)` — converts NPC for combat system
- Trader logic: sells cargo, buys cheap, moves toward ports
- Raider logic: attacks player if present + aggression roll, hides when low hull
- Patrol logic: stays in safe sectors

### GameState Integration

- `GameState` type updated with `npcs: NPC[]` and `news: NewsItem[]`
- `GameStateContainer` methods:
  - `getNPCsInSector(sectorId)` — filter by location
  - `getActiveNPCs(playerSectorId, radius=2)` — BFS dormant galaxy filter
  - `updateNPCs(npcs)` — replace NPC array
  - `addNews(item)` — append to news feed
- `createNewGameState()` factory generates 20 NPCs on galaxy creation

### CLI Integration

- **SectorScreen** shows NPCs in current sector with type icons:
  - 📦 cyan = trader
  - ⚠️ red = raider  
  - 🛡️ green = patrol
- **News ticker** shows last 3 headlines in a muted panel
- **Combat encounters** now check for raider NPCs first:
  - If raider in sector + aggression roll passes → fight that NPC
  - Fallback to random `rollEncounter()` if no NPC raider
- **Save/load** persists NPCs via `npcsJson` column (DB migration added)

### Files Changed

```
packages/engine/src/npcs/types.ts         (NEW)
packages/engine/src/npcs/generator.ts     (NEW)
packages/engine/src/npcs/brain.ts         (NEW)
packages/engine/src/state/types.ts        (+NPC, +NewsItem)
packages/engine/src/state/GameStateContainer.ts  (+NPC methods)
packages/engine/src/state/factory.ts      (+generateNPCs)
packages/engine/src/index.ts              (+NPC exports)
cli/src/screens/SectorScreen.tsx          (+NPC display, +news ticker)
cli/src/db/database.ts                    (+npcs_data migration)
cli/src/db/saveLoad.ts                    (+npcsJson save/load)
cli/src/index.tsx                         (+NPC state, +handleJumpComplete)
```

## Verification Results

- ✅ Engine typecheck clean
- ✅ CLI typecheck clean
- ✅ Binary builds successfully (~100MB)
- ✅ Legacy saves auto-migrate (npcs_data column added)
- ✅ 20 NPCs generated per galaxy with type distribution
- ✅ NPCs display in sector with color-coded type icons
- ✅ Raider NPCs can trigger combat on jump
- ✅ News ticker renders recent headlines

## Notes
- **Rule-based brain works offline at $0 cost.** LLM layer (03-02) will augment/replace `decideAction()`.
- **NPCs don't persist memory changes yet** — memory structures exist but aren't mutated beyond action logging.
- **Destroyed NPCs aren't removed** — combat with NPCs uses the NPC's stats, but the NPC stays in the galaxy. Full lifecycle (respawn, death) in a future phase.
- **Dormant galaxy implemented** via `getActiveNPCs(radius=2)`. Only NPCs within 2 sectors are processed per tick.
