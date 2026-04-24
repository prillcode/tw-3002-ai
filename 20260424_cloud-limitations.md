# Cloud Mode — Known Limitations & Next Steps

*Dated: 2026-04-24*
*Applies to: CLI v0.6.0 + Cloud API v0.1.0*

These limitations affect both the CLI cloud mode and any future web client. Fixing them now means the web client inherits working APIs.

---

## 1. Trade Prices Not Displayed in Cloud Mode

**Problem:** The trade overlay shows commodities and quantity, but not current port prices. The player is trading blind.

**Root Cause:** `cloudGetSector()` returns `port_inventory_json` (e.g., `{"ore":{"price":102,"supply":1135}}`), but CloudSectorScreen doesn't parse it into the trade UI.

**Impact:** High — trading is a core loop. Players need to see prices to make decisions.

**Next Step:**
1. In `CloudSectorScreen`, parse `port_inventory_json` from the current sector
2. Display buy/sell price per commodity in the trade overlay
3. Show profit margin estimate (if player has cargo of that commodity)

**Effort:** 1–2 hours

---

## 2. One-Shot Combat (No Round-by-Round)

**Problem:** Cloud combat resolves in a single API call. The player picks "Attack" and immediately sees the result. No tension, no narrative beats.

**Root Cause:** `POST /api/action/combat` returns a flat result object. The client has no per-round data to animate.

**Impact:** Medium — combat works, but lacks drama. Fine for MVP, worse for retention.

**Next Step (two options):**

**Option A — Quick Win (recommended for now):**
Keep one-shot but enrich the result with a narrative string:
```json
{
  "result": {
    "won": true,
    "narrative": "You opened fire. Their shields flickered. Second salvo cracked the hull. They broke apart. +250 cr looted.",
    ...
  }
}
```
Client displays the narrative as a story.

**Option B — Full Round-by-Round:**
1. Change `POST /api/action/combat` to return `rounds: CombatRound[]`
2. Each round has `{ roundNumber, playerDmg, enemyDmg, playerHull, enemyHull, narrative }`
3. Client animates rounds sequentially (like WarpTransition)

**Effort:** Option A = 30 min. Option B = 2–3 hours.

---

## 3. No StarDocks in Cloud Galaxy

**Problem:** No sectors are marked as stardocks. Players can't upgrade ships in cloud mode.

**Root Cause:** The seed script (`scripts/seed.ts`) doesn't assign any sectors as stardocks. The D1 schema has no `stardock` flag on sectors.

**Impact:** High — upgrades are a major progression system.

**Next Step:**
1. Add `stardock INTEGER DEFAULT 0` to the `sectors` table (migration)
2. In `scripts/seed.ts`, pick 3–5 sectors (one near FedSpace, others scattered) and set `stardock = 1`
3. Update `buildGalaxyFromCloud()` to read the flag and populate `galaxy.stardocks`
4. Add `POST /api/action/upgrade` endpoint for purchasing upgrades
5. Wire StarDock screen into CloudSectorScreen flow

**Effort:** 3–4 hours

---

## 4. NPCs Are Frozen (No Cloud Ticks)

**Problem:** NPCs never move, trade, or fight in the cloud. They sit in their seeded sectors forever.

**Root Cause:** No `/api/npc/tick` endpoint exists. The engine's `tickNPCs()` can't run in the Worker.

**Impact:** Critical — the galaxy feels dead after the first visit.

**Next Step:**
1. Build `POST /api/npc/tick` or a **Cron Trigger** (runs every 5 minutes)
2. Implement a lightweight rule-based tick directly in the Worker:
   - Traders: move toward ports, buy low, sell high
   - Raiders: move toward dangerous sectors, attack other NPCs
   - Patrols: move toward FedSpace, attack raiders
3. Update `npcs` table positions, credits, cargo
4. Insert news items for kills, trades, sector captures
5. Return tick summary (NPCs processed, actions taken)

**No LLM for now** — rule-based is deterministic, fast, and free.

**Effort:** 6–8 hours

---

## 5. Port Inventory Not Shared Between Players

**Problem:** Player A buys all the ore at a port. Player B sees the original supply because the galaxy is cached client-side.

**Root Cause:** The CLI fetches the galaxy once on login and never refreshes sector data. Port inventories in the DB mutate, but clients don't know.

**Impact:** Medium — breaks the shared-economy promise.

**Next Step:**
1. On every sector jump, call `cloudGetSector()` to refresh the current sector's inventory
2. Or add a lightweight `GET /api/galaxy/:id/sector/:id/inventory` endpoint
3. In the web client, poll sector data every 30 seconds when docked at a port

**Effort:** 1–2 hours

---

## 6. No PvP Combat

**Problem:** Players in the same sector can't attack each other.

**Root Cause:** No `POST /api/action/pvp` endpoint. The `pvp_kills` table exists but is unused.

**Impact:** Medium — PvP is a TW-2002 hallmark, but not critical for MVP.

**Next Step:**
1. `POST /api/action/pvp` — attacker initiates combat against another player in the same sector
2. Reuse the same combat resolver as NPC combat
3. Winner loots 50% of loser credits + some cargo
4. Loser respawns in FedSpace with 90% credits
5. Insert news item: "Player X destroyed Player Y near Sector Z"
6. Optional: Discord webhook notification

**Effort:** 4–6 hours

---

## 7. No Leaderboard Display

**Problem:** `GET /api/leaderboard` works but isn't shown anywhere in the CLI.

**Root Cause:** No screen renders the leaderboard data.

**Impact:** Low — nice to have, not critical.

**Next Step:**
1. Add a Leaderboard screen (accessed from Welcome menu or via a key in sector view)
2. Display top 10 players by net worth in the current galaxy
3. Show kills, deaths, ship class

**Effort:** 1–2 hours

---

## 8. Navigation Log Missing in Cloud Mode

**Problem:** Pressing `N` in CloudSectorScreen does nothing.

**Root Cause:** `onN` handler is wired in local `SectorScreen` but not in `CloudSectorScreen`.

**Impact:** Low — navigation log is a convenience feature.

**Next Step:**
1. Track `visitedSectorIds` in CloudSectorScreen state
2. Add `N` key handler to open a cloud-aware NavigationScreen
3. Cloud variant reads from local state (no server tracking needed)

**Effort:** 1 hour

---

## 9. No Help Screen Context for Cloud Mode

**Problem:** Pressing `H` in CloudSectorScreen does nothing.

**Root Cause:** `onH` handler not wired.

**Impact:** Low — help is discoverable from menu.

**Next Step:**
1. Wire `onH` in CloudSectorScreen to open HelpScreen with `'cloud'` context
2. Add `cloud` to `HelpContext` type
3. Document cloud-specific controls (same as local, but mention cloud mode)

**Effort:** 30 minutes

---

## 10. Ship Stats Not Computed from Class + Upgrades

**Problem:** CloudSectorScreen hardcodes `maxCargo: 120`, `maxHull: s.hull` instead of computing from class + upgrades.

**Root Cause:** The cloud DB stores raw hull/shield values but not effective stats. The engine's `computeEffectiveStats()` isn't called.

**Impact:** Medium — ship class differences are invisible in cloud mode.

**Next Step:**
1. Either: store effective stats in `player_ships` (denormalize)
2. Or: fetch class defaults + upgrades and call `computeEffectiveStats()` client-side
3. Update CloudSectorScreen to use computed values

**Effort:** 1–2 hours

---

## Recommended Fix Order

| Priority | Fix | Effort | Unblocks |
|----------|-----|--------|----------|
| 🔴 P0 | Trade prices display | 1–2h | Core economy loop |
| 🔴 P0 | StarDocks + upgrades | 3–4h | Progression system |
| 🔴 P0 | NPC ticks (rule-based) | 6–8h | Galaxy feels alive |
| 🟡 P1 | Port inventory refresh | 1–2h | Shared economy |
| 🟡 P1 | Ship stats from class | 1–2h | Class balance |
| 🟡 P1 | Round-by-round combat narrative | 2–3h | Combat feel |
| 🟢 P2 | Navigation log | 1h | Convenience |
| 🟢 P2 | Help screen | 30m | Discoverability |
| 🟢 P2 | Leaderboard display | 1–2h | Social feature |
| ⚪ P3 | PvP combat | 4–6h | Multiplayer depth |

---

## Web Client Implications

Every fix above directly benefits a future web client:
- **Trade prices** → web market UI needs prices
- **StarDocks** → web upgrade shop
- **NPC ticks** → web news feed stays fresh
- **Port inventory refresh** → web client shows real-time supply
- **Combat narrative** → web client displays story text
- **Leaderboard** → web leaderboard page

The web client will consume the same REST API. If the API is rich and correct, the web client is thin.

---

*See also: `cloud/AGENTS.md` for architecture constraints and `20260424_next-steps.md` for broader roadmap.*
