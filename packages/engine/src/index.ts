/**
 * @tw3002/engine — Game logic and types for TW 3002 AI.
 *
 * This package contains ALL game mechanics:
 * - Galaxy generation (sectors, ports, connections)
 * - Economy engine (pricing, supply/demand)
 * - Combat system (future)
 * - Ship systems (future)
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
