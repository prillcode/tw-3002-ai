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

### 3. Ship-Based Fighter / Wing Deployment
> **Note:** Distinct from TW-13 (sector-based fighter deployment). This is about tactical fighter squadrons on your ship.

Add fighter squadrons as a ship combat subsystem:
- Fighters absorb damage before hull
- Can be launched for extra damage (risk: if destroyed, they're gone)
- Recharge/restock at StarDock or over time
- Merchant gets cargo bays → fighter bays conversion? Or new ship module system.
- In classic TW2002, starting ships carry 30 fighters for defense — this could be the seed mechanic.

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

## 🪐 Planets & Economy (Post-TW-14)

Ideas that open up once planets and citadels exist:

### Planet Visualizer
- Show planet class as a visual card (M = blue/green, H = red/volcanic, O = oceanic)
- Colonist population bar, production dials for FOE
- Citadel level badge (⭐ to ⭐⭐⭐⭐⭐⭐)
- Q-cannon charge indicator

### Trade Route Heatmap
- After enough player trade data, generate a heatmap of profitable routes
- Visual overlay on sector map showing "hot" trade corridors
- Danger overlay: sectors with high fighter losses highlighted in red

### Planetary Invasion Cinematic
- When attacking a planet with citadel, show a step-by-step cinematic:
  - "Atmospheric cannons firing..." (hull damage number)
  - "Shields holding at 60%..."
  - "Planetary fighters scrambling..."
  - Each step pauses briefly, building tension

---

## 🚀 Ship Expansion Ideas (Post-TW-15)

TW2002 has 20+ ship classes. We're at 3. Key unlocks to add:

| Ship | When Unlocked | Role |
|------|--------------|------|
| Scout Marauder | Starter alt | Fast recon (2 turns/warp, 2:1 odds) |
| Merchant Freighter | Early | Trade focus (65 holds, 2 turns/warp) |
| Missile Frigate | Mid | Combat (5k figs, 1.3:1 odds) |
| Imperial StarShip | +1000 alignment + Commission | Endgame (50k figs, TransWarp) |
| Havoc GunStar | Late game | Tank (10k figs, 3k shields, TransWarp) |
| Interdictor Cruiser | Very late | Blockade specialist (100k figs) |

### Ship Unlock System
- Some ships require alignment (ISS needs +1000 good)
- Some require rank (Interdictor needs Admiral)
- Some require credits only (Merchant Freighter)
- Shipyard UI at StarDock showing locked/unlocked with requirements

---

## Priority Order (Post-TW-05 — Now Active)

**Immediate (Formal Work Items):**
1. **TW-13** — Sector fighter deployment (buy/deploy/encounter/blockade)
2. **TW-14** — Planets & citadels (creation/production/defense)
3. **TW-15** — Alignment system (good/evil paths, rob/steal, ISS)

**UI/UX Polish (Can parallel with above):**
4. **Comm Log** — Highest ROI idea. Replaces message banner, adds history.
5. **Combat Stances** — Adds meaningful choice without massive backend changes.

**Mid-term (After TW-15):**
6. **Operations Log** — Round-by-round combat narrative.
7. **Ship Expansion** — More classes, unlock system, shipyard UI.
8. **Ship-Based Fighter/Wing System** — Tactical squadrons in ship combat.

**Long-term / Maybe:**
9. **Heat/Systems Management** — Complex resource layer.
10. **Orbital Tactical Display** — Purely cosmetic.
11. **Trade Route Heatmap** — Requires data accumulation.
12. **Planetary Invasion Cinematic** — Visual polish.

---

*No corporation features.* Player collusion mechanics are deliberately excluded from all ideas.
*CRT/scanline mode remains excluded.* Clean terminal aesthetic is the identity.
