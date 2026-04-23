/**
 * Enemy / NPC combatant templates for encounters.
 */
import type { Combatant } from './types.js';
import { SeededRandom } from '../rng.js';
import type { DangerLevel } from '../types.js';

export interface EnemyTemplate {
  name: string;
  baseHull: number;
  baseShield: number;
  weaponDamage: number;
  dodgeChance: number;
  aggression: number;   // 0-1, likelihood to attack vs flee
  greed: number;        // 0-1, likelihood to accept bribe
  creditsBase: number;
}

const ENEMY_TEMPLATES: EnemyTemplate[] = [
  {
    name: 'Pirate Scout',
    baseHull: 60,
    baseShield: 10,
    weaponDamage: 6,
    dodgeChance: 0.15,
    aggression: 0.6,
    greed: 0.4,
    creditsBase: 800,
  },
  {
    name: 'Pirate Raider',
    baseHull: 90,
    baseShield: 20,
    weaponDamage: 10,
    dodgeChance: 0.10,
    aggression: 0.8,
    greed: 0.3,
    creditsBase: 1500,
  },
  {
    name: 'Pirate Dreadnought',
    baseHull: 140,
    baseShield: 35,
    weaponDamage: 16,
    dodgeChance: 0.05,
    aggression: 0.9,
    greed: 0.15,
    creditsBase: 3000,
  },
  {
    name: 'Renegade Trader',
    baseHull: 80,
    baseShield: 15,
    weaponDamage: 8,
    dodgeChance: 0.08,
    aggression: 0.4,
    greed: 0.7,
    creditsBase: 2000,
  },
];

const ENEMY_NAME_PREFIXES = [
  'Void', 'Dark', 'Crimson', 'Shadow', 'Iron', 'Rust',
  'Blood', 'Dust', 'Ash', 'Ember', 'Storm', 'Frost',
  'Ghost', 'Steel', 'Obsidian', 'Solar', 'Lunar',
];

const ENEMY_NAME_SUFFIXES = [
  'Fang', 'Claw', 'Reaver', 'Marauder', 'Skull',
  'Blade', 'Wolf', 'Raven', 'Viper', 'Hawk',
  'Scorpion', 'Drake', 'Serpent', 'Jackal',
];

function generateEnemyName(rng: SeededRandom): string {
  const prefix = rng.pick(ENEMY_NAME_PREFIXES);
  const suffix = rng.pick(ENEMY_NAME_SUFFIXES);
  return `${prefix} ${suffix}`;
}

/**
 * Generate a random enemy based on sector danger level.
 * Dangerous sectors produce stronger enemies.
 */
export function generateEnemy(
  danger: DangerLevel,
  seed: number
): Combatant {
  const rng = new SeededRandom(seed);

  // Pick template weighted by danger
  let templatePool: EnemyTemplate[];
  if (danger === 'dangerous') {
    templatePool = [ENEMY_TEMPLATES[1]!, ENEMY_TEMPLATES[2]!, ENEMY_TEMPLATES[3]!];
  } else if (danger === 'caution') {
    templatePool = [ENEMY_TEMPLATES[0]!, ENEMY_TEMPLATES[1]!, ENEMY_TEMPLATES[3]!];
  } else {
    templatePool = [ENEMY_TEMPLATES[0]!, ENEMY_TEMPLATES[3]!];
  }

  const template = rng.pick(templatePool);
  const name = `${template.name} "${generateEnemyName(rng)}"`;

  // Variation: ±15% on hull/shield, ±20% on credits
  const hull = Math.round(template.baseHull * rng.nextFloat(0.85, 1.15));
  const shield = Math.round(template.baseShield * rng.nextFloat(0.85, 1.15));
  const credits = Math.round(template.creditsBase * rng.nextFloat(0.8, 1.2));

  return {
    name,
    hull,
    maxHull: hull,
    shield,
    maxShield: shield,
    weaponDamage: template.weaponDamage,
    dodgeChance: template.dodgeChance,
    credits,
  };
}

/**
 * Get the template metadata for an enemy (for AI behavior).
 */
export function getEnemyBehavior(enemy: Combatant): { aggression: number; greed: number } {
  // Infer from stats: high damage + low dodge = aggressive
  // High credits relative to hull = greedy
  const aggression = enemy.weaponDamage > 12 ? 0.9 : enemy.weaponDamage > 8 ? 0.7 : 0.5;
  const greed = enemy.credits > 2000 ? 0.6 : 0.3;
  return { aggression, greed };
}
