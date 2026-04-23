/**
 * Encounter system — determines if combat triggers when entering a sector.
 */
import type { Sector, DangerLevel } from '../types.js';
import type { Combatant } from './types.js';
import { generateEnemy } from './npcs.js';

/** Encounter chance by danger level */
const ENCOUNTER_CHANCES: Record<DangerLevel, number> = {
  safe: 0,
  caution: 0.10,
  dangerous: 0.30,
};

/**
 * Roll for a combat encounter when entering a sector.
 * @returns An enemy combatant if an encounter triggers, null otherwise.
 */
export { generateEnemy } from './npcs.js';

export function rollEncounter(sector: Sector, seed: number): Combatant | null {
  const chance = ENCOUNTER_CHANCES[sector.danger];
  if (chance <= 0) return null;

  // Use a combined seed for determinism per sector visit
  const encounterSeed = seed + sector.id * 7919;
  const roll = Math.random(); // TODO: use seeded RNG if we want reproducibility

  if (roll < chance) {
    return generateEnemy(sector.danger, encounterSeed);
  }

  return null;
}

/**
 * Get the encounter chance for a sector (for UI display).
 */
export function getEncounterChance(sector: Sector): number {
  return ENCOUNTER_CHANCES[sector.danger];
}
