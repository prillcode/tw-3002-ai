export interface ShipStats {
  maxCargo: number;
  maxHull: number;
  maxTurns: number;
  baseTurnCost: number;
  combatBonus: number;
  dodgeChance: number;
  shieldPoints: number;
}

export interface ShipClass {
  id: string;
  name: string;
  description: string;
  baseStats: ShipStats;
}

export const SHIP_CLASSES: ShipClass[] = [
  {
    id: 'merchant',
    name: 'Spice Runner',
    description: 'Best for trading — haul more cargo through the spice lanes',
    baseStats: { maxCargo: 120, maxHull: 100, maxTurns: 80, baseTurnCost: 1, combatBonus: 0, dodgeChance: 0.05, shieldPoints: 0 },
  },
  {
    id: 'scout',
    name: 'Dune Skiff',
    description: 'Best for exploration — more turns per day for deep-space runs',
    baseStats: { maxCargo: 60, maxHull: 80, maxTurns: 120, baseTurnCost: 1, combatBonus: 0, dodgeChance: 0.10, shieldPoints: 0 },
  },
  {
    id: 'interceptor',
    name: 'Sardaukar Blade',
    description: 'Best for combat — tougher hull, built for aggression',
    baseStats: { maxCargo: 70, maxHull: 120, maxTurns: 100, baseTurnCost: 1, combatBonus: 2, dodgeChance: 0.08, shieldPoints: 0 },
  },
];

export function getShipClass(id: string): ShipClass | undefined {
  return SHIP_CLASSES.find(c => c.id === id);
}

import { UPGRADE_CATALOG } from './upgrades.js';

export function computeEffectiveStats(
  classId: string,
  ownedUpgrades: Record<string, number>,
): ShipStats {
  const shipClass = getShipClass(classId);
  if (!shipClass) return SHIP_CLASSES[0]!.baseStats;

  const stats = { ...shipClass.baseStats };

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

  stats.baseTurnCost = Math.max(0, stats.baseTurnCost);
  return stats;
}
