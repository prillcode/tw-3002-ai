# TW 3002 AI — Ideas & Inspiration Backlog

> Post-first-pass-PvP feature ideas. Don't start these until TW-05 is shipped.
> Source: [r/Tradewars "Sharing some in-progress screenshots" by rykker](https://www.reddit.com/r/Tradewars/comments/1qi91i8/)

---

## ⚔ Combat Depth

### 1. Combat Stances
Instead of a single "Attack" action, offer pre-combat stance selection:
- **Aggressive** — +damage dealt, +damage taken
- **Balanced** — standard tradeoff
- **Defensive** — -damage dealt, -damage taken, higher flee chance
- **Evasive** — lowest damage, highest flee/bribe success

Stance chosen at combat start (or default to Balanced) and affects the entire encounter.

### 2. Round-by-Round Operations Log
Current combat returns a single narrative paragraph. Expand to a turn-by-turn log:
```
[Round 1] Weapons array locked on enemy gun batteries — 8 DMG
[Round 1] Strike craft score multiple hits — 10 DMG
[Round 1] ENEMY: Hostile weapons impact our hull — 3 DMG
[Round 2] STATUS: Enemy weapons array crippled — Firepower -25%
[Round 2] TACTICAL: Braced for impact — Damage mitigated
```

This gives players a sense of *how* the fight unfolded, not just the outcome.

### 3. Fighter / Wing Deployment
Add fighter squadrons as a ship system:
- Fighters absorb damage before hull
- Can be launched for extra damage (risk: if destroyed, they're gone)
- Recharge/restock at StarDock or over time
- Merchant gets cargo bays → fighter bays conversion? Or new ship module system.

### 4. Heat / Systems Management
Track combat heat:
- Sustained fire builds heat
- Overheated weapons deal reduced damage or jam
- Emergency coolant dump as a tactical option
- Adds a resource-management layer to longer fights

---

## 📡 Comm Log (Message System Overhaul)

Replace the current single `message` string with a categorized, timestamped comm log:

```
T001 [NAV] Warped to Sector 42
T002 [TRD] Sold 50 ore for 12,500 cr
T003 [CMB] ⚔ Engaged Pirate Raider — Victory (+340 cr)
T004 [UPG] ⚡ Purchased Hull Plating Mk II
T005 [NAV] Warped to Sector 7
T006 [EVT] !!! Pirates detected in Sector 7 !!!
```

### Tags:
| Tag | Color | Meaning |
|-----|-------|---------|
| NAV | Cyan | Movement, warp, navigation |
| TRD | Yellow | Trade, market transactions |
| CMB | Red | Combat encounters |
| UPG | Magenta | StarDock upgrades |
| EVT | White | General events, news |
| SYS | Muted | System messages, turn regen |

### Behavior:
- Log persists per session (not across reloads)
- Shows last ~20 entries with scrollback
- Replaces the dismissable message banner in SectorView
- Accessible via a dedicated panel or integrated into a HUD drawer

---

## 🗺 Orbital Tactical Display

Add a mini tactical map to the combat screen showing relative positions:
- YOU (triangle), HOSTILE (X), PLANET (circle), BELT/ASTEROID (dot)
- Purely visual/flavor — no interactive mechanics
- Adds spatial context to combat narrative
- Could be a simple SVG overlay like our sector map

---

## 🏗 Deferred / Maybe Later

### CRT / Scanline Mode
**DELIBERATELY EXCLUDED.** The web client's clean terminal aesthetic is its own identity. A CRT mode would be fun but is low priority and doesn't fit the current visual direction.

---

## Priority Order (Post-TW-05)

1. **Comm Log** — Highest ROI. Replaces the janky message banner, adds history, improves game feel immediately.
2. **Combat Stances** — Adds meaningful choice to combat without massive backend changes.
3. **Operations Log** — Requires backend round-tracking, but makes combat feel much deeper.
4. **Fighter/Wing System** — New ship subsystem. Requires schema changes + UI work.
5. **Heat/Systems** — Most complex. Only after fighters are proven.
6. **Orbital Tactical Display** — Purely cosmetic. Nice to have.

---

*Don't start any of this until TW-05 PvP is live and stable.*
