/**
 * @tw3002/engine — Game logic and types for TW 3002 AI.
 *
 * This package contains ALL game mechanics:
 * - Galaxy generation (sectors, ports, connections)
 * - Economy engine (pricing, supply/demand)
 * - Combat system
 * - Ship systems
 *
 * It does NOT contain any UI or I/O code.
 */

// ─── Core Types ────────────────────────────────────────────

/** Commodity types traded at ports */
export type Commodity = 'ore' | 'organics' | 'equipment';

/** Port quality class (1 = best, 3 = worst) */
export type PortClass = 1 | 2 | 3;

/** Sector danger level */
export type DangerLevel = 'safe' | 'caution' | 'dangerous';

// ─── Port ──────────────────────────────────────────────────

export interface PortTrade {
  commodity: Commodity;
  /** buy = port buys from player, sell = port sells to player */
  direction: 'buy' | 'sell';
  basePrice: number;
}

export interface Port {
  name: string;
  class: PortClass;
  trades: PortTrade[];
  inventory: Record<Commodity, number>;
  restockRate: number;
}

// ─── Sector ────────────────────────────────────────────────

export interface Sector {
  id: number;
  name: string;
  coords: { x: number; y: number };
  port?: Port;
  danger: DangerLevel;
  region: string;
}

// ─── Connection ────────────────────────────────────────────

export interface Connection {
  from: number;
  to: number;
  type: 'warp' | 'toll';
  tollCost?: number;
}

// ─── Galaxy ────────────────────────────────────────────────

export interface GalaxyConfig {
  sectorCount: number;
  seed: number;
  fedSpaceRadius: number;
  portDensity: number;
  stardockCount: number;
}

export interface Galaxy {
  id: string;
  seed: number;
  sectors: Map<number, Sector>;
  connections: Connection[];
  fedSpace: number[];
  stardocks: number[];
  createdAt: string;
}

/** Default config for a new game */
export const DEFAULT_CONFIG: GalaxyConfig = {
  sectorCount: 100,
  seed: 0, // caller should set to Date.now() or specific seed
  fedSpaceRadius: 2,
  portDensity: 0.4,
  stardockCount: 1,
};

// ─── Economy ───────────────────────────────────────────────

export interface PriceQuote {
  commodity: Commodity;
  buyPrice: number;
  sellPrice: number;
  available: number;
  demand: number;
}

// ─── Engine Public API ─────────────────────────────────────

// Galaxy generation (to be implemented)
// export { createGalaxy } from './galaxy/generator';

// Economy (to be implemented)
// export { getPrices, executeTrade, tickEconomy } from './economy/pricing';
