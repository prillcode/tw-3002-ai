# 03-04-SUMMARY — NPC Memory & Reputation

**Status:** ✅ COMPLETE
**Executed:** 2026-04-23
**Duration:** ~35 min

## What Was Built

### `packages/engine/src/npcs/memory.ts`

**Grudge system:**
- `addGrudge(npc, targetId, targetName, reason, severity)` — adds/intensifies grudges, caps at 5 (drops lowest)
- `removeGrudge(npc, targetId)` — removes a grudge
- Severity 1-10, auto-capped

**Alliance system:**
- `addAlliance(npc, targetId, targetName)` — caps at 3 (drops oldest)
- `breakAlliance(npc, targetId)` — removes alliance

**Market observations:**
- `addMarketObservation(npc, sectorId, commodity, price)` — caps at 10 (drops oldest)

**Reputation tracker:**
- `updateReputation(npc, targetId, targetName, delta)` — score -100 to +100, tracks interactions
- `getReputation(npc, targetId)` — lookup helper

**Memory decay:**
- `decayMemory(npc)` — grudge severity -1 per 5 turns (remove below 2), market observations expire after 20 turns

### NPC Type Updates

- `NPCMemory.reputation?: Record<string, Reputation>` — optional field (backward compatible with existing saves)
- Generator initializes `reputation: {}`
- Respawned NPCs also get empty reputation

### Combat Memory Hooks (`cli/src/index.tsx`)

`handleCombatEnd` now updates NPC memory when fighting an NPC:
- **Player wins:** NPC gets grudge (severity 7) + reputation -15
- **Player flees:** NPC gets grudge (severity 3) + reputation -5
- **Player destroyed:** NPC reputation +10 (feels dominant)

`Combatant.npcId` added to track which NPC an enemy came from.

### Trading Memory Hooks (`cli/src/screens/MarketScreen.tsx`)

After every trade, all trader NPCs in the same sector:
- Get a market observation (sector, commodity, price)
- Reputation +3 if player sold at good price (>100 credits/unit)

### Prompt Updates (`packages/engine/src/llm/prompts.ts`)

`buildPrompt()` now includes:
- Grudges list (target, reason, severity)
- Alliances list
- Player reputation score
- Last 3 market observations

### Rule-Based Brain Updates (`packages/engine/src/npcs/brain.ts`)

`decideRaider` now uses reputation:
- Score < -50: always attack player
- Score > +20 (and aggression < 0.9): don't attack, stay idle
- Otherwise: normal aggression/caution rolls

### CLI Display (`cli/src/screens/SectorScreen.tsx`)

NPC list now shows reputation status:
- `friendly (+45)` in green (score > +30)
- `hostile (-72)` in red (score < -30)
- `neutral` in gray (otherwise)

### Files Changed

```
packages/engine/src/npcs/memory.ts       (NEW)
packages/engine/src/npcs/types.ts        (+reputation field)
packages/engine/src/npcs/generator.ts    (+reputation: {})
packages/engine/src/npcs/brain.ts        (+reputation checks in decideRaider)
packages/engine/src/npcs/tick.ts         (+decayMemory call)
packages/engine/src/llm/prompts.ts       (+memory context)
packages/engine/src/combat/types.ts      (+npcId optional)
packages/engine/src/index.ts             (+memory exports)
cli/src/index.tsx                        (+combat memory hooks)
cli/src/screens/MarketScreen.tsx         (+trade memory hooks)
cli/src/screens/SectorScreen.tsx         (+reputation display)
```

## Verification Results

- ✅ Engine typecheck clean
- ✅ CLI typecheck clean
- ✅ Binary builds successfully (~100MB)
- ✅ Grudges capped at 5 (lowest dropped)
- ✅ Alliances capped at 3 (oldest dropped)
- ✅ Market observations capped at 10 (oldest dropped)
- ✅ Reputation bounded -100 to +100
- ✅ Memory decay removes weak grudges and old observations
- ✅ Save/load backward compatible (reputation field is optional)

## Notes

- **Reputation is asymmetric and per-NPC.** Each NPC forms their own opinion. No gossip system yet.
- **Grudges are stronger than alliances.** Easier to make an enemy than a friend.
- **Decay is time-based** using real timestamps, not game turns. In a single session this won't be visible, but across multiple logins it will create natural forgetting.
