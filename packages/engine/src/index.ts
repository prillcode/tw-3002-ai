/**
 * @tw3002/engine — Game logic and types for TW 3002 AI.
 *
 * This package contains ALL game mechanics:
 * - Galaxy generation (sectors, ports, connections)
 * - Economy engine (pricing, supply/demand)
 * - Combat system (encounters, resolution)
 * - Ship systems (classes, upgrades)
 *
 * It does NOT contain any UI or I/O code.
 */

// ─── Types ─────────────────────────────────────────────────
export type {
  Commodity,
  PortClass,
  DangerLevel,
  PortTrade,
  Port,
  Sector,
  Connection,
  GalaxyConfig,
  Galaxy,
  PriceQuote,
  TradeAction,
  TradeResult,
} from './types.js';

export {
  COMMODITIES,
  BASE_PRICES,
} from './types.js';

// ─── RNG ───────────────────────────────────────────────────
export { SeededRandom } from './rng.js';

// ─── Galaxy Generation ─────────────────────────────────────
export { createGalaxy, getNeighborIds, DEFAULT_CONFIG, MAX_SECTOR_COUNT } from './galaxy/generator.js';

// ─── Economy ───────────────────────────────────────────────
export { getPrices, executeTrade, tickEconomy } from './economy/pricing.js';

// ─── Ships & Upgrades ──────────────────────────────────────
export type {
  ShipStats,
  ShipClass,
  Upgrade,
  PlayerShip,
} from './ships/upgrades.js';

export {
  SHIP_CLASSES,
  UPGRADE_CATALOG,
  getShipClasses,
  getShipClass,
  getAvailableUpgrades,
  getOwnedUpgrades,
  purchaseUpgrade,
  computeEffectiveStats,
} from './ships/upgrades.js';

// ─── Combat ────────────────────────────────────────────────
export type {
  Combatant,
  CombatAction,
  CombatRound,
  CombatResult,
  CombatState,
} from './combat/types.js';

export {
  initiateCombat,
  resolveRound,
  computeResult,
  computeFleeChance,
  computeBribeAmount,
} from './combat/resolver.js';

export {
  rollEncounter,
  getEncounterChance,
  generateEnemy,
} from './combat/encounters.js';

// ─── NPCs ──────────────────────────────────────────────────
export type {
  NPC,
  NPCType,
  NPCPersona,
  NPCAction,
  NPCMemory,
  NPCActionRecord,
  NewsItem,
} from './npcs/types.js';

export { generateNPCs } from './npcs/generator.js';

export {
  decideAction,
  decideRuleBased,
  executeNPCAction,
  npcToCombatant,
} from './npcs/brain.js';

export { tickNPCs } from './npcs/tick.js';
export type { TickStats } from './npcs/tick.js';

export {
  addGrudge,
  removeGrudge,
  addAlliance,
  breakAlliance,
  addMarketObservation,
  updateReputation,
  getReputation,
  decayMemory,
} from './npcs/memory.js';
export type { Reputation } from './npcs/memory.js';

// ─── LLM ───────────────────────────────────────────────────
export type {
  LLMProvider,
  LLMConfig,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  TokenUsage,
} from './llm/provider.js';

export { createProvider } from './llm/factory.js';
export { loadConfig, saveConfig, testLLMConnection } from './llm/config.js';
export type { ConfigLoadResult, LLMHealthResult } from './llm/config.js';
export { isOllamaAvailable } from './llm/ollama.js';
export { globalCache } from './llm/cache.js';
export type { DecisionCache, CacheEntry } from './llm/cache.js';

// ─── Turn Regeneration ─────────────────────────────────────
export { regenerateTurns, formatIdleTime, TURNS_PER_HOUR } from './turns.js';
export type { TurnRegenResult } from './turns.js';

// ─── State Management ──────────────────────────────────────
export type { GameState, Result, CombatRecord, TradeRecord } from './state/types.js';
export { GameStateContainer } from './state/GameStateContainer.js';
export { createNewGameState } from './state/factory.js';
export {
  canMoveTo,
  canTrade,
  canPurchaseUpgrade,
  validateState,
} from './state/validators.js';
