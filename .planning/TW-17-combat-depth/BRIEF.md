# TW-17: Combat Depth — Stances & Operations Log

## Work Identity
- **ID:** TW-17
- **Type:** Feature
- **Scope:** Cloud API + Web Client — pre-combat stance selection and round-by-round combat narrative

## Objective
Add two layers of combat depth: (1) a pre-combat stance selector that modifies damage/flee/bribe odds, and (2) a round-by-round operations log that shows *how* the fight unfolded instead of just the outcome. Together these transform combat from a single binary choice into a tactical decision.

## Context
Currently combat is single-round: pick attack/flee/bribe, get result + one-sentence narrative. The engine (`packages/engine/src/combat/resolver.ts`) has multi-round support with a `CombatRound` type including per-round logs, but the cloud API (`cloud/src/routes/action.ts`) resolves in one step. TW-17 makes cloud combat multi-round and adds a stance modifier to each round.

## In Scope
- 4 combat stances: Aggressive, Balanced, Defensive, Evasive
- Stance modifiers to damage dealt, damage taken, flee chance, bribe cost
- Multi-round cloud combat (2–4 rounds instead of 1)
- Round-by-round operations log returned in API response
- Web client displays operations log in CombatView
- Stance selector UI before/during combat

## Out of Scope
- Ship-based fighter squadrons (IDEAS.md #3 — separate work item)
- Heat/systems management (IDEAS.md #4 — long-term)
- Orbital tactical display (IDEAS.md — cosmetic)
- Engine-local combat changes (cloud only for now)

## Success Criteria
1. Player selects stance before combat, affecting outcome probabilities
2. Combat resolves in 2–4 rounds, not 1
3. Each round shows: player action, enemy action, damage dealt/taken, status
4. Operations log is displayed as a scrollable combat narrative
5. Stance choice meaningfully affects outcome (Aggressive = faster but riskier)

## Dependencies
- Blocked by: None (combat system is stable)
- Blocks: None
- Related: TW-13 (fighter encounters use same combat resolver), TW-16 (combat events feed into event log)

## References
- `.planning/IDEAS.md` — "Combat Stances" and "Round-by-Round Operations Log"
- `cloud/src/routes/action.ts` — current cloud combat handler
- `packages/engine/src/combat/resolver.ts` — multi-round engine (reference, not used directly)
- `packages/engine/src/combat/types.ts` — `CombatRound`, `CombatAction`, `Combatant`
- `web/game/src/views/CombatView.vue` — current combat UI

## Stance Modifiers

| Stance | Damage Dealt | Damage Taken | Flee Bonus | Bribe Discount |
|--------|-------------|-------------|------------|----------------|
| Aggressive | +30% | +20% | -10% | — |
| Balanced | — | — | — | — |
| Defensive | -20% | -30% | +10% | -15% |
| Evasive | -40% | -10% | +25% | -25% |

These are simple multipliers applied to `calculateDamage()` and `computeFleeChance()` / `computeBribeAmount()`.
