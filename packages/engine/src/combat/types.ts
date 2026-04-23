/**
 * Combat system types for TW 3002 AI.
 */

export interface Combatant {
  name: string;
  hull: number;
  maxHull: number;
  shield: number;
  maxShield: number;
  weaponDamage: number;
  dodgeChance: number;
  credits: number;
  /** If this combatant came from an NPC, track the NPC ID for memory/reputation. */
  npcId?: string;
}

export type CombatAction = 'attack' | 'flee' | 'bribe';

export interface CombatRound {
  round: number;
  playerAction: CombatAction;
  enemyAction: CombatAction;
  playerDamageDealt: number;
  playerDamageTaken: number;
  shieldAbsorbed: number;
  fled: boolean;
  bribeAccepted: boolean;
  bribeAmount: number;
  enemyDestroyed: boolean;
  playerDestroyed: boolean;
  log: string[];
}

export interface CombatResult {
  victory: boolean;
  fled: boolean;
  bribed: boolean;
  playerDestroyed: boolean;
  rounds: CombatRound[];
  totalDamageDealt: number;
  totalDamageTaken: number;
  creditsLost: number;
  creditsGained: number;
  hullRemaining: number;
  shieldRemaining: number;
}

export interface CombatState {
  player: Combatant;
  enemy: Combatant;
  round: number;
  isOver: boolean;
  result?: CombatResult;
}
