# TW-17 Roadmap: Combat Depth — Stances & Operations Log

**Estimated Total:** 5–7 hours (1–2 focused sessions)

## Phase 1: Multi-Round Cloud Combat (3–4 hours)
**Goal:** Cloud combat resolves in 2–4 rounds with per-round logging.

**Deliverables:**
- [ ] Rewrite `handleCombat()` in `cloud/src/routes/action.ts` to support multi-round resolution
- [ ] Port the engine's round logic (damage calc, flee, bribe) into the cloud handler
- [ ] Combat runs 2–4 rounds (stop when one side is destroyed, fled, or bribed)
- [ ] Return `rounds[]` array in API response alongside existing `result` and `narrative`
- [ ] Each round includes: `{ round, playerAction, enemyAction, damageDealt, damageTaken, log[] }`
- [ ] Generate per-round narrative templates (not just final outcome)
- [ ] Backward compatible: existing `result` / `narrative` fields still present

**Round structure returned:**
```json
{
  "result": { "won": true, "creditsGained": 340, ... },
  "narrative": "Your cannons tear through Pirate Raider...",
  "rounds": [
    { "round": 1, "playerAction": "attack", "enemyAction": "attack",
      "damageDealt": 45, "damageTaken": 12,
      "log": ["You fire lasers → Hit! 45 dmg", "Pirate Raider fires → Hit! 12 dmg"] },
    { "round": 2, "playerAction": "attack", "enemyAction": "flee",
      "damageDealt": 38, "damageTaken": 0,
      "log": ["You fire lasers → Hit! 38 dmg", "Pirate Raider attempts to flee!"] },
    { "round": 3, "playerAction": "attack", "enemyAction": "attack",
      "damageDealt": 0, "damageTaken": 0,
      "log": ["Pirate Raider destroyed!"] }
  ]
}
```

**Success:** Combat response includes 2–4 rounds with detailed logs.

---

## Phase 2: Combat Stances (1–2 hours)
**Goal:** Player selects stance before combat, modifying outcome probabilities.

**Deliverables:**
- [ ] Add `stance` parameter to `POST /api/action/combat` body
- [ ] Define stance multipliers in `cloud/src/routes/action.ts`:
  - Aggressive: +30% damage dealt, +20% damage taken, -10% flee chance
  - Balanced: no modifiers (default)
  - Defensive: -20% damage dealt, -30% damage taken, +10% flee chance
  - Evasive: -40% damage dealt, -10% damage taken, +25% flee chance, -25% bribe cost
- [ ] Apply multipliers to damage calculation and flee/bribe functions
- [ ] Validate stance value (reject unknown stances with 400)
- [ ] Default to Balanced if no stance provided (backward compatible)

**Success:** Aggressive stance wins faster but takes more damage. Evasive escapes more often.

---

## Phase 3: Stance Selector & Operations Log UI (1–2 hours)
**Goal:** Web client shows stance choice before combat and round-by-round log during/after.

**Deliverables:**
- [ ] Stance selector in CombatView (4 buttons: Aggressive / Balanced / Defensive / Evasive)
- [ ] Default to player's last used stance (stored in localStorage)
- [ ] Show stance modifiers on hover (tooltip: "+30% damage, +20% taken")
- [ ] Operations log display: scrollable list of round events
- [ ] Each round in a collapsible section with damage summary
- [ ] Final outcome shown at bottom with highlight (victory/defeat/escape)
- [ ] Mobile: stance buttons stack vertically, log scrolls in fixed-height container

**Success:** Combat feels tactical. Players choose stance based on situation. The fight tells a story.

---

## Phase Completion Order
1 → 2 → 3

Phase 1 is backend. Phase 2 is backend + API. Phase 3 is frontend.

---

## Definition of Done
- Cloud combat is multi-round (2–4 rounds)
- Stance modifier affects damage/flee/bribe probabilities
- Operations log shows round-by-round events
- Web client displays stance selector and operations log
- Single-round combat (old behavior) still works if stance omitted
