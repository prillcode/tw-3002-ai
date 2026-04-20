/**
 * Ship class definitions and upgrade system.
 */
import type { Commodity } from '../types.js';
import { COMMODITIES } from '../types.js';

// ─── Ship Stats ────────────────────────────────────────────

export interface ShipStats {
  maxCargo: number;
  maxHull: number;
  maxTurns: number;
  baseTurnCost: number;  // turns per jump
  combatBonus: number;   // damage bonus in combat
  dodgeChance: number;   // 0-1 probability of evading
  shieldPoints: number;  // damage absorption layer
}

// ─── Ship Classes ──────────────────────────────────────────

export interface ShipClass {
  id: string;
  name: string;
  description: string;
  baseStats: ShipStats;
}

export const SHIP_CLASSES: ShipClass[] = [
  {
    id: 'merchant',
    name: 'Merchant Vessel',
    description: 'Best for trading — haul more cargo',
    baseStats: {
      maxCargo: 120,
      maxHull: 100,
      maxTurns: 80,
      baseTurnCost: 1,
      combatBonus: 0,
      dodgeChance: 0.05,
      shieldPoints: 0,
    },
  },
  {
    id: 'scout',
    name: 'Scout Ship',
    description: 'Best for exploration — more turns per day',
    baseStats: {
      maxCargo: 60,
      maxHull: 80,
      maxTurns: 120,
      baseTurnCost: 1,
      combatBonus: 0,
      dodgeChance: 0.10,
      shieldPoints: 0,
    },
  },
  {
    id: 'interceptor',
    name: 'Interceptor',
    description: 'Best for combat — tougher hull',
    baseStats: {
      maxCargo: 70,
      maxHull: 120,
      maxTurns: 100,
      baseTurnCost: 1,
      combatBonus: 2,
      dodgeChance: 0.08,
      shieldPoints: 0,
    },
  },
];

export function getShipClasses(): ShipClass[] {
  return SHIP_CLASSES;
}

export function getShipClass(id: string): ShipClass | undefined {
  return SHIP_CLASSES.find(c => c.id === id);
}

// ─── Upgrades ──────────────────────────────────────────────

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  category: 'engines' | 'shields' | 'weapons' | 'cargo' | 'hull';
  tier: number;            // 1-3
  cost: number;
  /** Stat bonuses applied when upgrade is owned */
  effect: Partial<ShipStats>;
  /** Prerequisite upgrade id (null for tier 1) */
  prerequisite: string | null;
}

export const UPGRADE_CATALOG: Upgrade[] = [
  // ── Cargo Holds ──
  {
    id: 'cargo-1',
    name: 'Cargo Holds Mk I',
    description: '+30 cargo capacity',
    category: 'cargo',
    tier: 1,
    cost: 2000,
    effect: { maxCargo: 30 },
    prerequisite: null,
  },
  {
    id: 'cargo-2',
    name: 'Cargo Holds Mk II',
    description: '+40 cargo capacity',
    category: 'cargo',
    tier: 2,
    cost: 5000,
    effect: { maxCargo: 40 },
    prerequisite: 'cargo-1',
  },
  {
    id: 'cargo-3',
    name: 'Cargo Holds Mk III',
    description: '+50 cargo capacity',
    category: 'cargo',
    tier: 3,
    cost: 12000,
    effect: { maxCargo: 50 },
    prerequisite: 'cargo-2',
  },

  // ── Engines ──
  {
    id: 'engines-1',
    name: 'Ion Engines Mk I',
    description: '+5% dodge chance',
    category: 'engines',
    tier: 1,
    cost: 3000,
    effect: { dodgeChance: 0.05 },
    prerequisite: null,
  },
  {
    id: 'engines-2',
    name: 'Ion Engines Mk II',
    description: '+5% dodge, warp efficiency',
    category: 'engines',
    tier: 2,
    cost: 8000,
    effect: { dodgeChance: 0.05, baseTurnCost: -1 },
    prerequisite: 'engines-1',
  },
  {
    id: 'engines-3',
    name: 'Ion Engines Mk III',
    description: '+10% dodge, warp efficiency',
    category: 'engines',
    tier: 3,
    cost: 15000,
    effect: { dodgeChance: 0.10, baseTurnCost: -1 },
    prerequisite: 'engines-2',
  },

  // ── Hull Plating ──
  {
    id: 'hull-1',
    name: 'Hull Plating Mk I',
    description: '+20 max hull integrity',
    category: 'hull',
    tier: 1,
    cost: 2500,
    effect: { maxHull: 20 },
    prerequisite: null,
  },
  {
    id: 'hull-2',
    name: 'Hull Plating Mk II',
    description: '+30 max hull integrity',
    category: 'hull',
    tier: 2,
    cost: 6000,
    effect: { maxHull: 30 },
    prerequisite: 'hull-1',
  },
  {
    id: 'hull-3',
    name: 'Hull Plating Mk III',
    description: '+50 max hull integrity',
    category: 'hull',
    tier: 3,
    cost: 12000,
    effect: { maxHull: 50 },
    prerequisite: 'hull-2',
  },

  // ── Shields ──
  {
    id: 'shields-1',
    name: 'Deflector Shields Mk I',
    description: '+15 shield points',
    category: 'shields',
    tier: 1,
    cost: 4000,
    effect: { shieldPoints: 15 },
    prerequisite: null,
  },
  {
    id: 'shields-2',
    name: 'Deflector Shields Mk II',
    description: '+25 shield points',
    category: 'shields',
    tier: 2,
    cost: 10000,
    effect: { shieldPoints: 25 },
    prerequisite: 'shields-1',
  },
  {
    id: 'shields-3',
    name: 'Deflector Shields Mk III',
    description: '+40 shield points',
    category: 'shields',
    tier: 3,
    cost: 20000,
    effect: { shieldPoints: 40 },
    prerequisite: 'shields-2',
  },

  // ── Weapons ──
  {
    id: 'weapons-1',
    name: 'Pulse Lasers Mk I',
    description: '+5 combat damage',
    category: 'weapons',
    tier: 1,
    cost: 3500,
    effect: { combatBonus: 5 },
    prerequisite: null,
  },
  {
    id: 'weapons-2',
    name: 'Pulse Lasers Mk II',
    description: '+10 combat damage',
    category: 'weapons',
    tier: 2,
    cost: 9000,
    effect: { combatBonus: 10 },
    prerequisite: 'weapons-1',
  },
  {
    id: 'weapons-3',
    name: 'Pulse Lasers Mk III',
    description: '+15 combat damage',
    category: 'weapons',
    tier: 3,
    cost: 18000,
    effect: { combatBonus: 15 },
    prerequisite: 'weapons-2',
  },
];

// ─── Player Ship State ─────────────────────────────────────

export interface PlayerShip {
  name: string;
  classId: string;
  credits: number;
  currentSector: number;
  cargo: Record<Commodity, number>;
  hull: number;
  turns: number;
  maxTurns: number;
  /** Map of upgradeId → 1 (owned). Absent = not bought. */
  upgrades: Record<string, number>;
}

// ─── Upgrade Logic ─────────────────────────────────────────

/**
 * Get upgrades the player can purchase (next tier only, unowned).
 */
export function getAvailableUpgrades(ownedUpgrades: Record<string, number>): Upgrade[] {
  return UPGRADE_CATALOG.filter(upgrade => {
    // Already owned?
    if (ownedUpgrades[upgrade.id]) return false;
    // Prerequisite met?
    if (upgrade.prerequisite && !ownedUpgrades[upgrade.prerequisite]) return false;
    return true;
  });
}

/**
 * Get upgrades the player already owns.
 */
export function getOwnedUpgrades(ownedUpgrades: Record<string, number>): Upgrade[] {
  return UPGRADE_CATALOG.filter(u => ownedUpgrades[u.id]);
}

/**
 * Purchase an upgrade. Returns new player ship state or rejection.
 */
export function purchaseUpgrade(
  ship: PlayerShip,
  upgradeId: string,
): { success: boolean; ship: PlayerShip; reason?: string } {
  const upgrade = UPGRADE_CATALOG.find(u => u.id === upgradeId);
  if (!upgrade) {
    return { success: false, ship, reason: 'Upgrade not found' };
  }

  // Already owned?
  if (ship.upgrades[upgradeId]) {
    return { success: false, ship, reason: 'Already purchased' };
  }

  // Prerequisite met?
  if (upgrade.prerequisite && !ship.upgrades[upgrade.prerequisite]) {
    return { success: false, ship, reason: `Requires ${UPGRADE_CATALOG.find(u => u.id === upgrade.prerequisite)?.name ?? 'previous tier'}` };
  }

  // Can afford?
  if (ship.credits < upgrade.cost) {
    return { success: false, ship, reason: `Need ${upgrade.cost} credits (have ${ship.credits})` };
  }

  // Apply
  const newUpgrades = { ...ship.upgrades, [upgradeId]: 1 };
  const newShip: PlayerShip = {
    ...ship,
    credits: ship.credits - upgrade.cost,
    upgrades: newUpgrades,
  };

  return { success: true, ship: newShip };
}

/**
 * Compute effective stats from ship class + all owned upgrades.
 */
export function computeEffectiveStats(
  classId: string,
  ownedUpgrades: Record<string, number>,
): ShipStats {
  const shipClass = getShipClass(classId);
  if (!shipClass) {
    // Fallback to merchant
    return SHIP_CLASSES[0]!.baseStats;
  }

  const stats = { ...shipClass.baseStats };

  // Apply all owned upgrade effects
  for (const upgrade of UPGRADE_CATALOG) {
    if (!ownedUpgrades[upgrade.id]) continue;
    const effect = upgrade.effect;
    if (effect.maxCargo) stats.maxCargo += effect.maxCargo;
    if (effect.maxHull) stats.maxHull += effect.maxHull;
    if (effect.maxTurns) stats.maxTurns += effect.maxTurns;
    if (effect.baseTurnCost) stats.baseTurnCost += effect.baseTurnCost;
    if (effect.combatBonus) stats.combatBonus += effect.combatBonus;
    if (effect.dodgeChance) stats.dodgeChance += effect.dodgeChance;
    if (effect.shieldPoints) stats.shieldPoints += effect.shieldPoints;
  }

  // Clamp turn cost to minimum 0
  stats.baseTurnCost = Math.max(0, stats.baseTurnCost);

  return stats;
}
