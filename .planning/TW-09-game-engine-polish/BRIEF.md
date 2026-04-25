# TW-09 — Game Engine Polish

## Objective
Balance, tune, and harden the core game mechanics across local and cloud modes. Address rough edges in combat, trading, turn economy, ship classes, and NPC behavior so the game feels fair, challenging, and rewarding.

## Context
The engine (`packages/engine/`) and cloud API (`cloud/src/`) have working systems but have not been systematically balanced. Combat is too deterministic, trading profits are untuned, ship classes lack meaningful differentiation, and NPC behavior can feel random rather than strategic. This work item is about making the numbers *feel right*.

## Scope

### In Scope
- Combat balance (damage, flee chance, bribe logic, shield absorption)
- Trade economy balance (base prices, supply restock, price elasticity, port inventory)
- Ship class differentiation (stats, starting conditions, upgrade paths)
- Turn economy (regeneration rate, costs, max caps)
- NPC behavior tuning (aggression thresholds, trade logic, movement patterns)
- Edge case fixes (negative supply, overflow cargo, division by zero in pricing)
- Cloud/cloud parity (ensure local and cloud modes produce the same outcomes given the same inputs)

### Out of Scope
- New game mechanics (PvP, factions, quests — those are TW-05 and beyond)
- UI/UX improvements (those are TW-10 and CLI-specific work items)
- LLM NPC brain changes (TW-03 domain)
- Galaxy generation changes (TW-02 domain)

## Success Criteria
- A new player with a Merchant can make 10,000 credits in ~30 minutes of focused trading
- Combat against an equal-strength NPC is a 50/50 proposition without upgrades
- Death is painful but not devastating (10% credit loss feels fair)
- Each ship class has a clear identity and viable path to wealth
- NPCs feel alive — traders visit ports, raiders hunt in dangerous space, patrols protect FedSpace
- No exploits (infinite money loops, invincible ships, negative values)

## Relevant Files
- [`packages/engine/src/economy/pricing.ts`](../../../packages/engine/src/economy/pricing.ts)
- [`packages/engine/src/combat/resolver.ts`](../../../packages/engine/src/combat/resolver.ts)
- [`packages/engine/src/ships/upgrades.ts`](../../../packages/engine/src/ships/upgrades.ts)
- [`packages/engine/src/types.ts`](../../../packages/engine/src/types.ts)
- [`cloud/src/routes/action.ts`](../../../cloud/src/routes/action.ts)
- [`cloud/src/routes/npc.ts`](../../../cloud/src/routes/npc.ts)
- [`cli/src/screens/CloudSectorScreen.tsx`](../../../cli/src/screens/CloudSectorScreen.tsx)
