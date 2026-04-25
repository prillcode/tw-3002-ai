# TW-07 Roadmap: Polish and Balance

**Estimated Total:** 5–7 hours (1–2 focused sessions)

## Phase 1: Port Inventory Refresh (1–2 hours)
**Goal:** Port supply is shared across all players.

**Deliverables:**
- [ ] Call `cloudGetSector()` on every sector entry to refresh inventory
- [ ] Or add lightweight `GET /api/galaxy/:id/sector/:id/inventory` endpoint
- [ ] Display current supply in trade overlay

**Success:** Player A buying all ore reduces supply for Player B.

---

## Phase 2: Ship Stats from Class + Upgrades (1–2 hours)
**Goal:** Ship classes feel distinct in cloud mode.

**Deliverables:**
- [ ] Call `computeEffectiveStats()` in CloudSectorScreen with class + upgrades
- [ ] Remove hardcoded `maxCargo: 120`, `maxHull: s.hull`
- [ ] Ensure `player_ships` table stores `upgrades_json` correctly

**Success:** Merchant has 120 cargo, Scout has 120 turns, Interceptor has 120 hull.

---

## Phase 3: Combat Narrative (2–3 hours)
**Goal:** Cloud combat has storytelling, not just numbers.

**Deliverables:**
- [ ] Add narrative string generation to `POST /api/action/combat`
- [ ] Narrative varies by action (attack/flee/bribe) and outcome
- [ ] Client displays narrative as a story, not just stats

**Success:** Combat feels dramatic. Players screenshot their victories.

---

## Phase Completion Order
1 → 2 → 3

---

## Definition of Done
- Port inventories are shared
- Ship stats computed from class + upgrades
- Combat results include narrative
- All hardcoded values removed from CloudSectorScreen
