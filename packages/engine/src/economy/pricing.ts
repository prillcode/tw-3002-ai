/**
 * Economy pricing engine — supply/demand based price calculation.
 */
import type { Port, Commodity, PriceQuote, TradeAction, TradeResult } from '../types.js';
import { BASE_PRICES, COMMODITIES } from '../types.js';

/** Port class spread multipliers */
const CLASS_SPREAD: Record<number, number> = {
  1: 0.05,   // 5% — best ports, tightest spread
  2: 0.10,   // 10%
  3: 0.15,   // 15% — worst ports, widest spread
};

/** Inventory ratio for "full demand" (demand = 100) */
const DEMAND_FULL_STOCK = 2000;

/**
 * Calculate current prices for all commodities at a port.
 */
export function getPrices(port: Port): PriceQuote[] {
  const spread = CLASS_SPREAD[port.class] ?? 0.10;

  return COMMODITIES.map(commodity => {
    const base = BASE_PRICES[commodity];
    const stock = port.inventory[commodity] ?? 0;
    const stockRatio = Math.min(stock / DEMAND_FULL_STOCK, 1);

    // Demand: higher when stock is low
    const demand = Math.round((1 - stockRatio) * 100);

    // Find if port specializes in this commodity
    const trade = port.trades.find(t => t.commodity === commodity);

    // Port sells to player: price based on base + markup + scarcity
    const scarcityMarkup = (1 - stockRatio) * spread * 2;
    const buyPrice = Math.round(
      base * (1 + spread + scarcityMarkup)
    );

    // Port buys from player: price based on base - margin + need
    const needBonus = (1 - stockRatio) * spread * 1.5;
    const sellPrice = Math.round(
      base * (1 - spread * 0.5 + needBonus)
    );

    return {
      commodity,
      buyPrice: Math.max(1, buyPrice),
      sellPrice: Math.max(1, sellPrice),
      available: stock,
      demand,
    };
  });
}

/**
 * Execute a trade at a port. Mutates port inventory.
 */
export function executeTrade(
  port: Port,
  action: TradeAction,
  playerCredits: number,
  playerCargoSpace: number,
): { result: TradeResult; newCredits: number; cargoDelta: number } {
  const { commodity, direction, quantity } = action;

  if (quantity <= 0) {
    return {
      result: { success: false, commodity, quantity: 0, unitPrice: 0, totalPrice: 0, reason: 'Invalid quantity' },
      newCredits: playerCredits,
      cargoDelta: 0,
    };
  }

  const prices = getPrices(port);
  const quote = prices.find(p => p.commodity === commodity);

  if (!quote) {
    return {
      result: { success: false, commodity, quantity, unitPrice: 0, totalPrice: 0, reason: 'Commodity not available' },
      newCredits: playerCredits,
      cargoDelta: 0,
    };
  }

  if (direction === 'buy') {
    // Player buys FROM port → port loses inventory
    const unitPrice = quote.buyPrice;
    const totalPrice = unitPrice * quantity;

    if (totalPrice > playerCredits) {
      return {
        result: { success: false, commodity, quantity, unitPrice, totalPrice, reason: 'Not enough credits' },
        newCredits: playerCredits,
        cargoDelta: 0,
      };
    }

    if (quantity > quote.available) {
      return {
        result: { success: false, commodity, quantity, unitPrice, totalPrice, reason: `Port only has ${quote.available} units` },
        newCredits: playerCredits,
        cargoDelta: 0,
      };
    }

    if (quantity > playerCargoSpace) {
      return {
        result: { success: false, commodity, quantity, unitPrice, totalPrice, reason: `Not enough cargo space (${playerCargoSpace} available)` },
        newCredits: playerCredits,
        cargoDelta: 0,
      };
    }

    // Execute: port inventory decreases
    port.inventory[commodity] = (port.inventory[commodity] ?? 0) - quantity;

    return {
      result: { success: true, commodity, quantity, unitPrice, totalPrice },
      newCredits: playerCredits - totalPrice,
      cargoDelta: quantity,
    };
  } else {
    // Player sells TO port → port gains inventory
    const unitPrice = quote.sellPrice;
    const totalPrice = unitPrice * quantity;

    // Execute: port inventory increases
    port.inventory[commodity] = (port.inventory[commodity] ?? 0) + quantity;

    return {
      result: { success: true, commodity, quantity, unitPrice, totalPrice },
      newCredits: playerCredits + totalPrice,
      cargoDelta: -quantity,
    };
  }
}

/**
 * Advance economy by one tick: ports restock.
 */
export function tickEconomy(port: Port): void {
  for (const commodity of COMMODITIES) {
    const current = port.inventory[commodity] ?? 0;
    const maxStock = port.class === 1 ? 3000 : port.class === 2 ? 2000 : 1000;

    // Restock toward max, not past it
    const restocked = Math.min(current + port.restockRate, maxStock);
    port.inventory[commodity] = restocked;
  }
}
