# TW-05 Roadmap: PvP Update

**Estimated Total:** 24-32 hours (3-4 focused sessions)

> **Note:** This roadmap covers ship-to-ship PvP dueling. True TW2002 fighter-based sector control (defensive figs, blockades, Q-Cannons) is TW-06.

## Phase 1: PvP Combat Foundation (6-8 hours)
**Goal:** Players can attack each other in shared cloud galaxies

**Deliverables:**
- [ ] `POST /pvp/attack` — validate attacker and target are in same sector
- [ ] `POST /pvp/resolve` — run combat resolver, return result
- [ ] `GET /pvp/status` — check if PvP is possible in current sector; list other players present
- [ ] Player combatant object (same interface as NPC combatant)
- [ ] Loot calculation: **25% credits** + 10% cargo (random selection) — *conservative until defensive options exist*
- [ ] Respawn logic: FedSpace, 90% credits, cargo lost, hull/shield full
- [ ] News item generation: "prillcode destroyed DarkReaver in Sector 42"
- [ ] PvP kill tracking (who killed whom, when)

**Protection systems (same phase):**
- [ ] New player check: net worth < 10,000 OR account age < 24h = invulnerable
- [ ] FedSpace check: PvP blocked entirely in safe sectors
- [ ] Self-attack prevention
- [ ] Offline vulnerability: offline players **without deployed fighters** are vulnerable to direct attack (for first pass, all offline players are vulnerable unless in FedSpace or under new-player protection — fighter deployment is TW-06)

**Success:** Two players in the same sector can fight. Winner loots, loser respawns.

---

## Phase 2: Bounty & Reputation (5-7 hours)
**Goal:** Consequences for indiscriminate PvP

**Deliverables:**
- [ ] Player reputation score (separate from NPC reputation)
- [ ] "Wanted" status: 3+ unprovoked kills in 24h
- [ ] NPC patrols hunt wanted players (TW-03 brain integration)
- [ ] Bounty board API: list wanted players by sector
- [ ] Bounty reward: NPC patrols pay credits for wanted kills
- [ ] Wanted indicator in sector screen: red ☠️ next to player name
- [ ] Wanted status decays: -1 kill every 48h of no PvP

**Notes:**
- This is a **placeholder** for a full alignment system. Future expansion will replace the simple kill-count wanted system with good/evil alignment paths, reward posting, and ISS unlocks. See `../lore-reference/alignment/`.

**Success:** Being a pirate is viable but dangerous. NPCs become your problem.

---

## Phase 3: Notifications (4-5 hours)
**Goal:** Players know when they've been attacked or killed

**Deliverables:**
- [ ] Discord webhook integration (`~/.tw3002/config.json` → `discordWebhook`)
- [ ] Notification events: attacked, destroyed, bounty placed, bounty cleared
- [ ] Digest mode: "While you were away..." summary on login
- [ ] In-game kill log: `~/.tw3002/kills.log` or DB table
- [ ] Optional email notifications (reuse TW-04 email auth)

**Discord message format:**
```
⚔️ **PvP Alert**
Your ship was destroyed by **DarkReaver** in Sector 42.
Loot lost: 12,000 credits, 15 ore
Respawn: Sol Prime (FedSpace)
```

**Success:** Victims know who hit them. Pirates get notoriety.

---

## Phase 4: Leaderboards & Stats (4-5 hours)
**Goal:** Track and display PvP achievements

**Deliverables:**
- [ ] `GET /leaderboard/kills` — top PvP killers
- [ ] `GET /leaderboard/networth` — richest players
- [ ] Player profile API: kills, deaths, K/D ratio, wanted status
- [ ] In-game leaderboard screen (accessible from main menu)
- [ ] Web leaderboard at `tw3002.gg/leaderboard`

**Success:** Players compete for rankings. Bragging rights matter.

---

## Phase 5: Polish & Balance (5-7 hours)
**Goal:** PvP feels fair, tense, and fun — not frustrating

**Deliverables:**
- [ ] Combat balance pass: don't let maxed-out ships one-shot newbies
- [ ] Escape mechanics: 20% chance to flee PvP if you have engine upgrades
- [ ] Cloaking device (upgrade): hide from scanners for 1 turn
- [ ] Ship insurance (StarDock): pay 5% of net worth to reduce death penalty to 5%
- [ ] PvP toggle: players can opt out (but get a "pacifist" badge, no PvP rewards)
- [ ] Admin tools: ban griefers, reset wanted status, inspect kill logs

**Notes:**
- **Insurance is prerequisite to increasing loot.** Once players can insure ships, Phase 1 loot can be raised from 25% toward 50% (matching TW2002's harsher economy).
- **Combat is simultaneous for simplicity.** Future: implement ordered combat sequence (empty ships → player ships by sign-on order → sector fighters). See `../lore-reference/strategy/combat.md`.

**Success:** PvP is opt-in by risk tolerance, not forced. Competitive but not cruel.

---

## Phase 6: Fighter Deployment & Sector Control (TW-06)
**Goal:** Implement true TW2002 PvP — fighter-based sector control, not ship dueling

**This is NOT part of TW-05.** See `../TW-06-fighter-deployment/phases/06-01-PLAN.md`.

**Preview of scope:**
- Buy/deploy fighters in sectors (Defensive 1:1, Offensive 2:1, Tolled)
- Sector fighter encounters on entry
- Blockades (deny access to Stardock or FedSpace via figs)
- Corp-level fighter accounting
- Q-Cannon damage formulas for planetary defense
- True offline protection via deployed fighters

---

## Phase Completion Order
1 → 2 → 3 → 4 → 5

Phase 1 is core combat. Phases 2-3 add consequences and awareness. Phase 4 is social. Phase 5 is tuning. Phase 6 (TW-06) is the leap to true TW2002-style sector warfare.

---

## Definition of Done
- Players can attack each other in shared galaxies
- Combat is fair (same resolver as NPC combat)
- New players are protected
- FedSpace is safe
- Wanted system creates consequences
- Discord notifications work
- Leaderboards display top players
- Combat feels balanced and fun

---

## Notes
- **This is an update, not a rewrite.** It builds on TW-04 cloud infrastructure.
- **PvP is opt-out, not opt-in.** Everyone can be attacked by default (with protections). This matches TW2002's DNA.
- **Insurance is the soft-protection.** Players who hate risk can buy their way to safety.
- **Bounty system is the hard-protection.** It doesn't stop griefing, it makes griefers into content for bounty hunters.
- **First-pass loot is intentionally conservative (25%).** It will increase after TW-06 fighter deployment and Phase 5 insurance give players more defensive options.
