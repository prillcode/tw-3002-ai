# 02-06-SUMMARY — Combat System

**Status:** ✅ COMPLETE
**Executed:** 2026-04-22
**Duration:** ~2 hours (estimated 6-8 hours)

## What Was Built

### Engine Combat Layer (`packages/engine/src/combat/`)

**`types.ts`** — Combatant, CombatAction, CombatRound, CombatResult, CombatState interfaces

**`npcs.ts`** — 4 enemy templates:
- Pirate Scout (low hull, high dodge, low damage)
- Pirate Raider (balanced)
- Pirate Dreadnought (high hull/shield/damage)
- Renegade Trader (cowardly, bribe-prone)

**`resolver.ts`** — Full combat resolution:
- `initiateCombat()`, `resolveRound()`, `computeResult()`
- Damage formula: weapon × variance, shield absorbs 50% of hit, remainder to hull
- Flee chance: based on dodge difference, clamped 10-90%
- Bribe: scales with enemy maxHull, clamped 500 cr – 50% player credits
- Enemy AI: rule-based action selection (attack/flee/bribe weighted by health/aggression/greed)

**`encounters.ts`** — Encounter chance by danger level:
- Safe: 0%
- Caution: 10%
- Dangerous: 30%

### CLI Combat Screen (`cli/src/screens/CombatScreen.tsx`)

- Full TUI with enemy info, health bars, threat stars
- Round-by-round combat log
- 3 actions: Attack, Flee (shows %), Bribe (shows cost, disabled if unaffordable)
- Result screen: victory/escaped/bribed/defeated summary
- Destroyed screen: respawn message with penalty info

### Integration

- **SectorScreen**: Triggers `rollEncounter()` after each jump, passes enemy to App
- **App.tsx**: New `'combat'` mode, handles `handleCombatStart/End`
- **ShipStatus**: Added shield display (conditional, only if maxShield > 0)
- **Save system**: Added `shield` column to DB with migration
- **Shield regen**: Restores to max on every jump (first-hit buffer mechanic)
- **Respawn**: Hull 0 → FedSpace center, -10% credits, full hull/shield restore

### Files Changed

```
packages/engine/src/combat/types.ts          (NEW)
packages/engine/src/combat/npcs.ts           (NEW)
packages/engine/src/combat/resolver.ts       (NEW)
packages/engine/src/combat/encounters.ts     (NEW)
packages/engine/src/index.ts                 (+combat exports)
cli/src/screens/CombatScreen.tsx             (NEW)
cli/src/screens/SectorScreen.tsx             (+combat trigger, shield props)
cli/src/screens/index.ts                     (+CombatScreen export)
cli/src/components/ShipStatus.tsx            (+shield display)
cli/src/db/database.ts                       (+shield migration)
cli/src/db/saveLoad.ts                       (+shield save/load)
cli/src/index.tsx                            (+combat mode, handlers)
```

## Verification Results

- ✅ Engine typecheck clean
- ✅ CLI typecheck clean
- ✅ Binary builds successfully
- ✅ Save/load includes shield
- ✅ Legacy DB auto-migrates (adds shield column)

## Notes
- **No loot yet** — victory gives 30% of enemy credits only. Real loot in TW-03.
- **Enemy AI is rule-based** — LLM-driven NPC decisions in TW-03 will replace this.
- **Balance is conservative** — dreadnoughts are dangerous, scouts are evasive. Tune in 02-08.
