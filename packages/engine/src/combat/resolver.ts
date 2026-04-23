/**
 * Combat resolution engine.
 * Turn-based rounds with attack, flee, and bribe mechanics.
 */
import type { Combatant, CombatAction, CombatRound, CombatResult, CombatState } from './types.js';
import { getEnemyBehavior } from './npcs.js';
import { SeededRandom } from '../rng.js';

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Create initial combat state.
 */
export function initiateCombat(player: Combatant, enemy: Combatant): CombatState {
  return {
    player: { ...player },
    enemy: { ...enemy },
    round: 0,
    isOver: false,
  };
}

/**
 * Compute the enemy's action for this round.
 * Simple rule-based: aggressive enemies attack, damaged enemies flee or accept bribe.
 */
function enemyAction(enemy: Combatant, playerCredits: number): CombatAction {
  const { aggression, greed } = getEnemyBehavior(enemy);
  const healthRatio = enemy.hull / enemy.maxHull;

  // Low health: more likely to flee or take bribe
  if (healthRatio < 0.25) {
    return Math.random() < 0.6 ? 'flee' : 'bribe';
  }

  // Medium health: mixed behavior
  if (healthRatio < 0.5) {
    if (Math.random() < greed && playerCredits > enemy.credits) {
      return 'bribe';
    }
    if (Math.random() < 0.4) return 'flee';
  }

  // Healthy: mostly attack
  return Math.random() < aggression ? 'attack' : 'flee';
}

/**
 * Calculate damage for an attack.
 */
function calculateDamage(attacker: Combatant, defender: Combatant): { hit: boolean; rawDamage: number; absorbed: number; hullDamage: number } {
  const hit = Math.random() > defender.dodgeChance;
  if (!hit) {
    return { hit: false, rawDamage: 0, absorbed: 0, hullDamage: 0 };
  }

  const rawDamage = attacker.weaponDamage * randomRange(0.8, 1.2);
  const shieldAbsorb = Math.min(defender.shield, rawDamage * 0.5);
  defender.shield -= shieldAbsorb;
  const hullDamage = rawDamage - shieldAbsorb;
  defender.hull -= hullDamage;

  return { hit: true, rawDamage, absorbed: shieldAbsorb, hullDamage };
}

/**
 * Compute flee success chance.
 */
export function computeFleeChance(player: Combatant, enemy: Combatant): number {
  const baseChance = player.dodgeChance * 100;
  // Speed advantage: higher dodge = faster
  const speedDiff = (player.dodgeChance - enemy.dodgeChance) * 50;
  const chance = baseChance + speedDiff;
  return Math.max(10, Math.min(90, chance));
}

/**
 * Compute bribe amount.
 */
export function computeBribeAmount(enemy: Combatant, playerCredits: number): number {
  const base = enemy.maxHull * 15;
  const variance = base * randomRange(-0.2, 0.2);
  const amount = Math.round(base + variance);
  const minBribe = 500;
  const maxBribe = Math.floor(playerCredits * 0.5);
  return Math.max(minBribe, Math.min(maxBribe, amount));
}

/**
 * Resolve one combat round.
 */
export function resolveRound(state: CombatState, playerAction: CombatAction): { state: CombatState; round: CombatRound } {
  if (state.isOver) {
    throw new Error('Combat is already over');
  }

  const roundNum = state.round + 1;
  const player = { ...state.player };
  const enemy = { ...state.enemy };
  const log: string[] = [];

  let fled = false;
  let bribeAccepted = false;
  let bribeAmount = 0;
  let playerDamageDealt = 0;
  let playerDamageTaken = 0;
  let shieldAbsorbed = 0;

  const enemyAct = enemyAction(enemy, player.credits);

  // ── Player flees ──
  if (playerAction === 'flee') {
    const fleeChance = computeFleeChance(player, enemy);
    const success = Math.random() * 100 < fleeChance;
    if (success) {
      fled = true;
      log.push(`You engage warp drives and escape!`);
    } else {
      log.push(`Escape failed! The enemy cuts you off.`);
      // Enemy gets a free attack
      if (enemyAct === 'attack') {
        const dmg = calculateDamage(enemy, player);
        if (dmg.hit) {
          playerDamageTaken += dmg.hullDamage;
          shieldAbsorbed += dmg.absorbed;
          log.push(`${enemy.name} fires → Hit! ${Math.round(dmg.rawDamage)} dmg (${Math.round(dmg.absorbed)} shield)`);
        } else {
          log.push(`${enemy.name} fires → Missed!`);
        }
      }
    }
  }

  // ── Player bribes ──
  if (playerAction === 'bribe') {
    bribeAmount = computeBribeAmount(enemy, player.credits);
    const { greed } = getEnemyBehavior(enemy);
    bribeAccepted = Math.random() < greed && player.credits >= bribeAmount;

    if (bribeAccepted) {
      player.credits -= bribeAmount;
      log.push(`You offer ${bribeAmount.toLocaleString()} credits.`);
      log.push(`${enemy.name} accepts the bribe and disengages.`);
    } else {
      log.push(`You offer ${bribeAmount.toLocaleString()} credits.`);
      log.push(`${enemy.name} scoffs at your offer and attacks!`);
      // Enemy attacks
      if (enemyAct === 'attack') {
        const dmg = calculateDamage(enemy, player);
        if (dmg.hit) {
          playerDamageTaken += dmg.hullDamage;
          shieldAbsorbed += dmg.absorbed;
          log.push(`${enemy.name} fires → Hit! ${Math.round(dmg.rawDamage)} dmg (${Math.round(dmg.absorbed)} shield)`);
        } else {
          log.push(`${enemy.name} fires → Missed!`);
        }
      }
    }
  }

  // ── Combat exchange (only if not fled/bribed) ──
  if (!fled && !bribeAccepted && playerAction === 'attack') {
    // Player attacks first
    const playerDmg = calculateDamage(player, enemy);
    if (playerDmg.hit) {
      playerDamageDealt += playerDmg.hullDamage;
      log.push(`You fire lasers → Hit! ${Math.round(playerDmg.rawDamage)} dmg`);
    } else {
      log.push(`You fire lasers → Missed!`);
    }

    // Enemy counter-attacks (if not destroyed)
    if (enemy.hull > 0 && enemyAct === 'attack') {
      const enemyDmg = calculateDamage(enemy, player);
      if (enemyDmg.hit) {
        playerDamageTaken += enemyDmg.hullDamage;
        shieldAbsorbed += enemyDmg.absorbed;
        log.push(`${enemy.name} fires → Hit! ${Math.round(enemyDmg.rawDamage)} dmg (${Math.round(enemyDmg.absorbed)} shield)`);
      } else {
        log.push(`${enemy.name} fires → Missed!`);
      }
    } else if (enemy.hull > 0 && enemyAct === 'flee') {
      log.push(`${enemy.name} attempts to flee!`);
      // Enemy fleeing doesn't end combat immediately — they just don't attack this round
    }
  }

  // ── Clamp values ──
  player.hull = Math.max(0, Math.min(player.maxHull, player.hull));
  player.shield = Math.max(0, Math.min(player.maxShield, player.shield));
  enemy.hull = Math.max(0, Math.min(enemy.maxHull, enemy.hull));
  enemy.shield = Math.max(0, Math.min(enemy.maxShield, enemy.shield));

  const enemyDestroyed = enemy.hull <= 0;
  const playerDestroyed = player.hull <= 0;
  const isOver = fled || bribeAccepted || enemyDestroyed || playerDestroyed;

  const round: CombatRound = {
    round: roundNum,
    playerAction,
    enemyAction: enemyAct,
    playerDamageDealt,
    playerDamageTaken,
    shieldAbsorbed,
    fled,
    bribeAccepted,
    bribeAmount,
    enemyDestroyed,
    playerDestroyed,
    log,
  };

  const newState: CombatState = {
    player,
    enemy,
    round: roundNum,
    isOver,
  };

  if (isOver) {
    const creditsGained = enemyDestroyed ? Math.round(enemy.credits * 0.3) : 0;
    const creditsLost = bribeAccepted ? bribeAmount : playerDestroyed ? Math.floor(player.credits * 0.1) : 0;

    newState.result = {
      victory: enemyDestroyed,
      fled,
      bribed: bribeAccepted,
      playerDestroyed,
      rounds: [], // Will be populated by caller
      totalDamageDealt: 0,
      totalDamageTaken: 0,
      creditsLost,
      creditsGained,
      hullRemaining: player.hull,
      shieldRemaining: player.shield,
    };
  }

  return { state: newState, round };
}

/**
 * Compute final combat result from a completed combat state.
 * Call this after all rounds are resolved.
 */
export function computeResult(state: CombatState, rounds: CombatRound[]): CombatResult {
  if (!state.isOver || !state.result) {
    throw new Error('Combat not over yet');
  }

  const totalDamageDealt = rounds.reduce((s, r) => s + r.playerDamageDealt, 0);
  const totalDamageTaken = rounds.reduce((s, r) => s + r.playerDamageTaken, 0);

  return {
    ...state.result,
    rounds,
    totalDamageDealt,
    totalDamageTaken,
  };
}
