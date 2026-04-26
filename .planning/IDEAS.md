# TW 3002 AI — Ideas & Inspiration Backlog

> Unplanned feature ideas not yet covered by a work item.
> Source: [r/Tradewars "Sharing some in-progress screenshots" by rykker](https://www.reddit.com/r/Tradewars/comments/1qi91i8/)

---

## ⚔ Ship-Based Fighter / Wing Deployment

> Distinct from TW-13 (sector-based fighter deployment). This is about tactical fighter squadrons on your ship.

Add fighter squadrons as a ship combat subsystem:
- Fighters absorb damage before hull
- Can be launched for extra damage (risk: if destroyed, they're gone)
- Recharge/restock at StarDock or over time
- Merchant gets cargo bays → fighter bays conversion? Or new ship module system.
- In classic TW2002, starting ships carry 30 fighters for defense — this could be the seed mechanic.

**Dependencies:** TW-13 (sector fighters) must ship first to establish fighter economy.

---

## 🔥 Heat / Systems Management

Track combat heat:
- Sustained fire builds heat
- Overheated weapons deal reduced damage or jam
- Emergency coolant dump as a tactical option
- Adds a resource-management layer to longer fights

**Dependencies:** TW-17 (multi-round combat) must ship first.

---

## 🗺 Orbital Tactical Display

Add a mini tactical map to the combat screen showing relative positions:
- YOU (triangle), HOSTILE (X), PLANET (circle), BELT/ASTEROID (dot)
- Purely visual/flavor — no interactive mechanics
- Adds spatial context to combat narrative
- Could be a simple SVG overlay like our sector map

**Dependencies:** None. Purely cosmetic.

---

## 🪐 Trade Route Heatmap

After enough player trade data, generate a heatmap of profitable routes:
- Visual overlay on sector map showing "hot" trade corridors
- Danger overlay: sectors with high fighter losses highlighted in red
- Requires data accumulation from multiple play sessions

**Dependencies:** TW-14 (planets), significant player data.

---

## 🚀 Ship Expansion (Post-TW-15)

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

**Dependencies:** TW-15 (alignment system) for alignment-gated ships.

---

## ✅ Covered by Existing Work Items

These ideas now have formal planning docs:

| Idea | Work Item |
|------|-----------|
| Sector fighter deployment | **TW-13** — Fighter Deployment & Sector Control |
| Planets & citadels | **TW-14** — Planets & Citadels |
| Planet visualizer | **TW-14** — implicit |
| Planetary invasion cinematic | **TW-14** — implicit |
| Alignment system | **TW-15** — Alignment System |
| Ship unlocks (ISS, etc.) | **TW-15** — ISS at +1000 alignment |
| Shipyard UI | **TW-15** — scope |
| Comm & event log | **TW-16** — Comm & Event Log |
| Combat stances | **TW-17** — Combat Depth |
| Round-by-round operations log | **TW-17** — Combat Depth |

---

## 🚫 Explicitly Excluded

- **CRT / Scanline Mode** — The web client's clean terminal aesthetic is its own identity.
- **Corporations / corp sharing** — Player collusion mechanics excluded from all ideas.
- **Ship-to-ship dueling** — Not authentic TW2002. Fighter-based combat (TW-13) is the real thing.
