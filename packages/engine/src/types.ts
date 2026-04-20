/**
 * Core game entity types for TW 3002 AI engine.
 */

// ─── Primitives ────────────────────────────────────────────

/** Commodity types traded at ports */
export type Commodity = 'ore' | 'organics' | 'equipment';

/** All commodities as a const array for iteration */
export const COMMODITIES: readonly Commodity[] = ['ore', 'organics', 'equipment'];

/** Port quality class (1 = best, 2 = medium, 3 = worst) */
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

// ─── Economy ───────────────────────────────────────────────

export interface PriceQuote {
  commodity: Commodity;
  buyPrice: number;     // player pays to buy from port
  sellPrice: number;    // player receives when selling to port
  available: number;    // port stock
  demand: number;       // 0-100 demand level
}

export interface TradeAction {
  commodity: Commodity;
  direction: 'buy' | 'sell';  // buy from port, sell to port
  quantity: number;
}

export interface TradeResult {
  success: boolean;
  commodity: Commodity;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  reason?: string;
}

// ─── Base Prices ───────────────────────────────────────────

export const BASE_PRICES: Record<Commodity, number> = {
  ore: 100,
  organics: 50,
  equipment: 200,
};
