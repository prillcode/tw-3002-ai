/**
 * NPC types for TW 3002 AI.
 * Rule-based brain (LLM plugs in later).
 */
import type { Commodity } from '../types.js';
import type { Combatant } from '../combat/types.js';

export type NPCType = 'trader' | 'raider' | 'patrol';

export type NPCFaction = 'choam' | 'fremen' | 'sardaukar' | 'guild' | 'independent';

export interface NPCPersona {
  type: NPCType;
  faction: NPCFaction;
  name: string;
  aggression: number;      // 0-1, likelihood to attack
  caution: number;         // 0-1, likelihood to flee
  greed: number;           // 0-1, prioritizes profit
  loyalty: number;         // 0-1, faction stickiness
  flavor: string;          // brief personality description
}

export interface Grudge {
  targetId: string;
  targetName: string;
  reason: string;
  severity: number;        // 1-10
  formedAt: string;        // ISO timestamp
}

export interface Alliance {
  targetId: string;
  targetName: string;
  formedAt: string;
}

export interface MarketObservation {
  sectorId: number;
  commodity: Commodity;
  price: number;
  at: string;
}

export interface NPCMemory {
  lastActions: NPCActionRecord[];
  grudges: Grudge[];
  alliances: Alliance[];
  marketObservations: MarketObservation[];
  reputation?: Record<string, import('./memory.js').Reputation>;
}

export interface NPCActionRecord {
  action: NPCAction;
  result: string;           // brief outcome description
  at: string;               // ISO timestamp
}

export type NPCAction =
  | { type: 'move'; targetSector: number }
  | { type: 'trade'; commodity: Commodity; direction: 'buy' | 'sell'; quantity: number }
  | { type: 'attack'; targetId: string }
  | { type: 'flee'; targetId: string }
  | { type: 'idle' };

export interface NPC {
  id: string;
  persona: NPCPersona;
  ship: Combatant;
  currentSectorId: number;
  credits: number;
  cargo: Record<Commodity, number>;
  memory: NPCMemory;
  isActive: boolean;
  turnsSinceSpawn: number;
}

export interface NewsItem {
  timestamp: string;
  headline: string;
  type: 'trade' | 'combat' | 'movement' | 'event';
  sectorId?: number;
}
