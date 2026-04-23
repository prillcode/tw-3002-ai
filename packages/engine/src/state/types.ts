/**
 * Game state types for the centralized state manager.
 */
import type { Galaxy, TradeAction, TradeResult } from '../types.js';
import type { CombatResult } from '../combat/types.js';
import type { NPC, NewsItem } from '../npcs/types.js';
import type { PlayerShip } from '../ships/upgrades.js';

export interface CombatRecord {
  timestamp: string;
  enemyName: string;
  result: 'victory' | 'defeat' | 'fled' | 'bribed';
  rounds: number;
  damageDealt: number;
  damageTaken: number;
  creditsDelta: number;
}

export interface TradeRecord {
  timestamp: string;
  sectorId: number;
  commodity: string;
  direction: 'buy' | 'sell';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface GameState {
  galaxy: Galaxy;
  player: PlayerShip;
  currentSectorId: number;
  turnsUsed: number;
  turnsRegenRate: number;
  lastPlayedAt: string;
  combatLog: CombatRecord[];
  tradeLog: TradeRecord[];
  npcs: NPC[];
  news: NewsItem[];
}

export interface Result<T> {
  ok: boolean;
  value?: T;
  error?: string;
}
