# 02-05-SUMMARY — Ship Systems & StarDock Upgrades

**Status:** ✅ COMPLETE  
**Executed:** 2026-04-19

## What Was Built

### Engine: Ship System (`packages/engine/src/ships/upgrades.ts`)

**3 Ship Classes:**

| Class | Cargo | Hull | Turns | Dodge | Focus |
|-------|-------|------|-------|-------|-------|
| Merchant | 120 | 100 | 80 | 5% | Trading |
| Scout | 60 | 80 | 120 | 10% | Exploration |
| Interceptor | 70 | 120 | 100 | 8% | Combat |

**15 Upgrades (5 categories × 3 tiers):**

| Category | Tier 1 | Tier 2 | Tier 3 | Effect |
|----------|--------|--------|--------|--------|
| Cargo Holds | 2,000 cr | 5,000 cr | 12,000 cr | +30/+40/+50 cargo |
| Ion Engines | 3,000 cr | 8,000 cr | 15,000 cr | +5%/+5%/+10% dodge |
| Hull Plating | 2,500 cr | 6,000 cr | 12,000 cr | +20/+30/+50 hull |
| Deflector Shields | 4,000 cr | 10,000 cr | 20,000 cr | +15/+25/+40 shield |
| Pulse Lasers | 3,500 cr | 9,000 cr | 18,000 cr | +5/+10/+15 damage |

**Functions:** getShipClasses(), getAvailableUpgrades(), purchaseUpgrade(), computeEffectiveStats()

### CLI Screens

- **ShipClassSelectScreen** — pick class after naming ship (3 options with stats)
- **StarDockScreen** — upgrade shop at StarDock sectors (D key from sector view)
- **SectorScreen** updated — shows [D] StarDock hint, wires D key

### New Game Flow

```
Welcome → Slot → Galaxy Size → Name Ship → Pick Class → Play
```

### Save System

- GameState gains `shipClassId` and `upgradesJson` fields
- DB columns: `ship_class_id TEXT DEFAULT 'merchant'`, `upgrades_data TEXT DEFAULT '{}'`
- Legacy saves auto-migrate to merchant class with no upgrades

## Files Changed

```
packages/engine/src/ships/upgrades.ts  # NEW — ship classes + upgrade system
cli/src/screens/ShipClassSelectScreen.tsx  # NEW
cli/src/screens/StarDockScreen.tsx     # NEW
cli/src/hooks/useKeyHandler.ts         # added onD handler
cli/src/screens/SectorScreen.tsx       # StarDock access (D key)
cli/src/screens/index.ts               # new exports
cli/src/db/database.ts                 # migration: ship_class_id, upgrades_data
cli/src/db/saveLoad.ts                 # GameState + save/load new fields
cli/src/index.tsx                      # shipClass state, new modes
```

## Verification

- ✅ All 3 classes have correct base stats
- ✅ Upgrade chain enforces prerequisites
- ✅ Can't skip tiers (cargo-3 rejected without cargo-2)
- ✅ Effective stats: merchant + all cargo = 240 maxCargo
- ✅ StarDock accessible via D key
- ✅ DB save/load preserves class + upgrades
- ✅ TypeScript clean, binary builds
