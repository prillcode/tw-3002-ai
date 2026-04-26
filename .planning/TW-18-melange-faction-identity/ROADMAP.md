# TW-18 Roadmap: Melange & Faction Identity

**Estimated Total:** 8-12 hours (1-2 focused sessions)

> **Identity is not a luxury — it's the difference between a game and a universe.**
> Reference: `../lore-reference/UNIVERSE-BIBLE.md`

## Phase 1: Melange as 4th Commodity (4-6 hours)
**Goal:** Melange appears in ports, can be traded, has extreme value, and is consumed for TransWarp.

### Schema Changes
- [ ] Add `melange` to port inventory generation (alongside ore/organics/equipment)
- [ ] Melange supply rules:
  - Only ports in sectors with `danger: 'dangerous'` or `danger: 'caution'` carry melange
  - Supply is 5-10% of typical ore supply (very scarce)
  - Base price: ~5,000 cr/unit (vs ~100 cr/unit for ore) — 50x more valuable
- [ ] Add `melange` column to `player_ships.cargo_json` tracking

### API Changes
- [ ] `POST /api/action/trade` — handle melange as valid commodity
- [ ] `GET /api/galaxy/:id/sector` — melange included in `port_inventory_json`
- [ ] TransWarp consumption hook: when a TransWarp-capable ship jumps, deduct 1 melange from cargo
  - If no melange in cargo, TransWarp fails with error "Insufficient melange for TransWarp"
  - Standard warp (lane travel) does NOT consume melange

### Web Client Changes
- [ ] `MarketView.vue` — add melange to commodity selector (4th option)
- [ ] Melange shown with distinct styling: amber/gold color, ⚡ icon
- [ ] Ship cargo panel shows melange count
- [ ] TransWarp UI shows melange cost when available (future: TW-15 Guild Navigator ship)

### Pricing
| Commodity | Base Price | Typical Supply |
|-----------|-----------|----------------|
| Ore | ~100 cr | 500-2000 |
| Organics | ~150 cr | 300-1500 |
| Equipment | ~250 cr | 200-800 |
| **Melange** | **~5,000 cr** | **25-100** |

**Success:** Melange is rare, extremely valuable, and feels different from other commodities.

---

## Phase 2: NPC Factions & Name Pools (2-3 hours)
**Goal:** NPCs have faction identity with appropriate names and behavior profiles.

### Schema / Data Changes
- [ ] Add `faction` field to NPC persona type: `'choam' | 'fremen' | 'sardaukar' | 'guild' | 'independent'`
- [ ] Map existing types to factions:
  - `trader` → `independent` (Free Traders) or `choam` (CHOAM Merchants)
  - `raider` → `fremen` (Fremen Warriors) or `sardaukar` (Sardaukar Raiders)
  - `patrol` → `choam` (Guild Sentinels)
- [ ] Faction-specific name pools in `packages/engine/src/npcs/generator.ts`:

**Fremen Names** (desert/warrior feel):
- Chani, Stilgar, Jamis, Otheym, Farok, Shishakli, Muriz, Namri, Shoab, Ali
- Suffixes: the Knife, Sandrider, Dune Walker, Sietch Keeper, Worm Rider, Deep Desert, Maker Finder, Stillman

**Sardaukar Names** (brutal military feel):
- Aramsham, Tyekanik, Bashar, Cando, Kryubi, Iakin, Nefud, Lichna, Farok, Saag
- Suffixes: Iron Fist, the Hammer, Breaker, Siege Lord, the Flayer, Black Blade, War Priest

**CHOAM / Guild Names** (bureaucratic):
- Vries, De Vries, Margot, Fenring, Shaddam, Wensicia, Alia, Irulan, Farok, Bannerjee
- Suffixes: Trade Commissioner, Guild Officer, Factor, Legate, Emissary, Attaché

**Free Trader Names** (keep existing generic pool):
- Zed, Kira, Jax, Vex, Nora, Milo — existing pool is fine for independents

### Faction Behavior Profiles
- [ ] **Fremen:** High aggression, high caution, low greed. Territorial. Toll at 5cr/fig. Don't rob.
- [ ] **Sardaukar:** Maximum aggression, low caution, moderate greed. Attack on sight. Never flee.
- [ ] **CHOAM:** Moderate aggression, high caution, low greed. Patrol safe sectors. Attack Sardaukar.
- [ ] **Independent:** Low aggression, high caution, moderate greed. Standard trader behavior.

### Seed Data
- [ ] Update `cloud/scripts/seed.ts` to generate faction-appropriate NPCs
- [ ] Existing NPC split: ~40% Free Trader, ~25% Fremen, ~20% Sardaukar, ~15% CHOAM

**Success:** NPCs feel like they belong to distinct factions, not a homogenous pool.

---

## Phase 3: Ship Renaming & UI Terminology (2-3 hours)
**Goal:** Rename ships and update all UI-facing text to use faction terminology.

### Ship Renaming
- [ ] `web/game/src/data/ships.ts`:
  - Merchant Vessel → **Spice Runner** (id stays `merchant` for backward compatibility)
  - Scout Ship → **Dune Skiff** (id stays `scout`)
  - Interceptor → **Sardaukar Blade** (id stays `interceptor`)
- [ ] Update seed data ship name references
- [ ] Update `web/game/src/views/StarDockView.vue` ship catalog display names

### UI Terminology Pass
Update text strings across web client:

| Current | New | File(s) |
|---------|-----|---------|
| "FedSpace" | "CHOAM Protected Space" | SectorView, CombatView |
| "Insurance" | "Guild Protection Contract" | StarDockView |
| "Wanted" | "CHOAM Bounty Target" | LeaderboardView, SectorView |
| "Bounty Board" | "CHOAM Bounty Board" | LeaderboardView |
| "News" | "CHOAM Broadband" | SectorView news ticker |

### NPC Display
- [ ] `SectorView.vue` — NPC list shows faction icon:
  - Fremen: ⚔ (amber)
  - Sardaukar: 💀 (red)
  - CHOAM/Guild: 🛡 (cyan)
  - Independent: 📦 (muted)
- [ ] `CombatView.vue` — enemy display shows faction name: "Sardaukar Blade — Sardaukar" instead of generic type

### Combat Narrative Factions
- [ ] `cloud/src/routes/action.ts` — add faction-specific narrative variants:
  - vs Fremen: "The desert warrior fights with fanatical intensity..."
  - vs Sardaukar: "The Sardaukar's brutal assault is relentless..."
  - vs CHOAM: "The Guild Sentinel holds the line with disciplined fire..."
  - vs Independent: "The trader's guns blaze in desperation..."
- [ ] News headlines reference factions: "Sardaukar raider destroyed in Sector 42", "Fremen warriors hold Sector 150"

**Success:** The game feels like a distinct universe. Players encounter Fremen and Sardaukar, not generic raiders. Ships have evocative names. UI text reinforces faction identity.

---

## Phase Completion Order
1 → 2 → 3

Phase 1 is the mechanical core (melange). Phase 2 is NPC identity. Phase 3 is surface-level naming and text. All three together create the identity layer.

---

## Definition of Done
- Melange is tradeable at ports with appropriate rarity and value
- TransWarp consumes melange (mechanical hook ready for future ships)
- NPCs have faction field with faction-specific names and behavior
- Ship classes have Dune-inspired display names
- UI text uses CHOAM/Guild terminology
- Combat narrative varies by enemy faction
- News headlines reference factions by name
- Universe Bible is referenced from all affected work items

---

## Notes
- **Backward compatibility:** Ship `id` fields stay `merchant`, `scout`, `interceptor` in code. Only display names change. This avoids breaking existing ship data in D1.
- **Melange pricing is tunable.** Start at 5,000 cr/unit. If it's too easy to get rich, reduce supply. If it's too rare to matter, increase supply.
- **Faction behavior profiles are subtle.** Fremen and Sardaukar are both "raider" types, but Fremen are territorial (defend, toll) while Sardaukar are aggressive (attack, destroy). The `faction` field determines which raider behavior applies.
- **This is the foundation for TW-15.** Alignment-based faction interactions (Sardaukar targeting good players, Fremen tolerating evil players) depend on the `faction` field existing on NPCs.
- **The Universe Bible is the source of truth.** Any question about faction behavior, terminology, or tone should be resolved by checking `../lore-reference/UNIVERSE-BIBLE.md`.
