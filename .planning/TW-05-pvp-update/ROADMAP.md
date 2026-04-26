# TW-05 Roadmap: PvP Infrastructure

**Estimated Total:** 16-20 hours (2-3 focused sessions)

> **Pivot Note:** Ship-to-ship PvP dueling was removed from scope after reviewing the Stardock Modern Manual. True TW2002 combat is fighter-based sector control (TW-06). TW-05 now builds the reusable infrastructure that TW-06 will plug into.

## Phase 1: Loot, Respawn & Kill Tracking (4-5 hours)
**Goal:** Define and implement the consequences of PvP death

**Deliverables:**
- [ ] `POST /combat/loot` — calculate loot from a defeated player (25% credits + 10% cargo)
- [ ] `POST /combat/respawn` — move player to FedSpace, apply penalties, restore hull/shield
- [ ] `pvp_kills` table populated with winner, loser, sector, timestamp, loot
- [ ] Update `player_ships`: `kills`, `deaths`, `pvp_kills_json` columns
- [ ] Loot stored as transaction record for audit/debug

**Penalties (first pass — conservative until defensive options exist):**
- Destroyed player: respawn in nearest FedSpace, keep 75% credits (25% lost to attacker), cargo lost
- Attacker gains: 25% of victim's credits + 10% of cargo (random commodity)
- Hull and shield restored to max on respawn

**Success:** When a player is "defeated" (by any mechanism — NPC, fighter encounter, or future PvP), the loot/respawn pipeline works correctly.

---

## Phase 2: Bounty & Wanted System (4-5 hours)
**Goal:** Track and punish indiscriminate aggression

**Deliverables:**
- [ ] Player reputation score on `player_ships` table
- [ ] "Wanted" status: 3+ unprovoked kills in 24h = wanted
- [ ] NPC patrols hunt wanted players (TW-03 brain integration)
- [ ] Bounty board API: `GET /bounty/board` — list wanted players by sector
- [ ] Wanted indicator: red ☠️ in sector/player lists
- [ ] Wanted status decay: -1 kill every 48h of no aggression
- [ ] `pvp_kills` flagged as `provoked` vs `unprovoked` (provoked = attacked first)

**Notes:**
- This is a **placeholder** for a full alignment system (good/evil paths, reward posting, ISS unlocks). See `../lore-reference/alignment/`.
- The bounty system doesn't prevent griefing — it makes griefers into content.

**Success:** Aggressive players become hunted. The ecosystem self-regulates.

---

## Phase 3: News & Notifications (4-5 hours)
**Goal:** The galaxy knows when violence happens

**Deliverables:**
- [ ] News generation on every PvP kill: "DarkReaver destroyed prillcode in Sector 42"
- [ ] News generation on wanted status changes
- [ ] Discord webhook integration (opt-in via player settings)
- [ ] In-game digest: "While you were away: 2 attacks, 1 death, bounty cleared"
- [ ] Notification events: killed, destroyed, bounty_placed, bounty_cleared, wanted

**Discord format:**
```
⚔️ PvP Alert
Your ship was destroyed by DarkReaver in Sector 42.
Loot lost: 12,000 credits, 15 ore
Respawn: Sol Prime (FedSpace)
```

**Success:** Victims know what happened. The galaxy feels alive.

---

## Phase 4: Leaderboards & Stats (3-4 hours)
**Goal:** Bragging rights and competition

**Deliverables:**
- [ ] `GET /leaderboard/kills` — top killers
- [ ] `GET /leaderboard/deaths` — most deaths (alternative leaderboard)
- [ ] `GET /leaderboard/networth` — richest players
- [ ] `GET /leaderboard/wanted` — most wanted
- [ ] Player profile endpoint: kills, deaths, K/D, wanted status, net worth
- [ ] Web client: LeaderboardView.vue updated with kill/death columns

**Success:** Players compete for rankings. The numbers matter.

---

## Phase 5: Protections & Balance (3-4 hours)
**Goal:** Prevent griefing, protect newcomers

**Deliverables:**
- [ ] New player check: net worth < 10k OR account age < 24h = invulnerable
- [ ] FedSpace check: no PvP possible in safe sectors (enforced at all entry points)
- [ ] Self-attack prevention
- [ ] Offline vulnerability: offline players are vulnerable unless in FedSpace or under new-player protection (TW-06 fighters will provide offline defense)
- [ ] Admin tools: reset wanted status, inspect kill logs, ban griefers
- [ ] Ship insurance at StarDock (pay 5% net worth to reduce death penalty from 25% → 5%)

**Success:** PvP is opt-out by risk tolerance, not forced. Competitive but not cruel.

---

## Phase Completion Order
1 → 2 → 3 → 4 → 5

Phase 1 is core consequences. Phases 2-3 add ecosystem awareness. Phase 4 is social. Phase 5 is guardrails.

---

## Definition of Done
- Loot and respawn pipeline works for any defeat event (NPC, fighter, future PvP)
- Kills and deaths are tracked
- Wanted system creates consequences
- News and notifications inform players
- Leaderboards display rankings
- New players are protected
- FedSpace is safe
- Insurance reduces risk for cautious players
- All infrastructure is ready for TW-06 fighter-based combat

---

## Notes
- **No ship-to-ship dueling endpoints.** The first player-visible PvP will be fighter encounters in TW-06.
- **Loot is intentionally conservative (25%).** Will raise to 50% after TW-06 fighter deployment gives players defensive layers.
- **Insurance is the soft-protection.** Players who hate risk can buy their way to safety.
- **Bounty system is the hard-protection.** It doesn't stop griefing, it makes griefers into content.
