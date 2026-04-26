/**
 * State validators — ensure game invariants hold.
 */
import type { GameState } from './types.js';
import type { TradeAction } from '../types.js';
import { computeEffectiveStats, UPGRADE_CATALOG } from '../ships/upgrades.js';
import { getNeighborIds } from '../galaxy/generator.js';

/**
 * Check if a move to a sector is valid.
 */
export function canMoveTo(state: GameState, sectorId: number): boolean {
  const neighbors = getNeighborIds(state.galaxy, state.currentSectorId);
  return neighbors.includes(sectorId) && state.player.turns > 0;
}

/**
 * Check if a trade is valid.
 */
export function canTrade(
  state: GameState,
  trade: TradeAction,
): { ok: boolean; reason?: string } {
  const sector = state.galaxy.sectors.get(state.currentSectorId);
  if (!sector?.port) {
    return { ok: false, reason: 'No port in this sector' };
  }

  const stats = computeEffectiveStats(state.player.classId, state.player.upgrades);
  const cargoTotal =
    (state.player.cargo.ore ?? 0) + (state.player.cargo.organics ?? 0) + (state.player.cargo.equipment ?? 0);

  if (trade.direction === 'buy') {
    if (cargoTotal + trade.quantity > stats.maxCargo) {
      return { ok: false, reason: 'Not enough cargo space' };
    }
  } else {
    const owned = state.player.cargo[trade.commodity] ?? 0;
    if (trade.quantity > owned) {
      return { ok: false, reason: `Not enough ${trade.commodity} to sell` };
    }
  }

  return { ok: true };
}

/**
 * Check if an upgrade can be purchased.
 */
export function canPurchaseUpgrade(
  state: GameState,
  upgradeId: string,
): { ok: boolean; reason?: string } {
  const upgrade = UPGRADE_CATALOG.find(u => u.id === upgradeId);
  if (!upgrade) {
    return { ok: false, reason: 'Upgrade not found' };
  }

  if (state.player.upgrades[upgradeId]) {
    return { ok: false, reason: 'Already purchased' };
  }

  if (upgrade.prerequisite && !state.player.upgrades[upgrade.prerequisite]) {
    return { ok: false, reason: 'Prerequisite not met' };
  }

  if (state.player.credits < upgrade.cost) {
    return { ok: false, reason: `Need ${upgrade.cost} credits` };
  }

  return { ok: true };
}

/**
 * Validate all state invariants. Returns list of violations (empty = valid).
 */
export function validateState(state: GameState): string[] {
  const violations: string[] = [];
  const stats = computeEffectiveStats(state.player.classId, state.player.upgrades);

  if (state.player.credits < 0) {
    violations.push(`Negative credits: ${state.player.credits}`);
  }

  const cargoTotal =
    (state.player.cargo.ore ?? 0) + (state.player.cargo.organics ?? 0) + (state.player.cargo.equipment ?? 0);
  if (cargoTotal > stats.maxCargo) {
    violations.push(`Cargo overflow: ${cargoTotal}/${stats.maxCargo}`);
  }

  for (const [commodity, amount] of Object.entries(state.player.cargo)) {
    if (amount < 0) {
      violations.push(`Negative cargo: ${commodity} = ${amount}`);
    }
  }

  if (state.player.hull < 0 || state.player.hull > stats.maxHull) {
    violations.push(`Invalid hull: ${state.player.hull}/${stats.maxHull}`);
  }

  if (state.player.shield < 0 || state.player.shield > stats.shieldPoints) {
    violations.push(`Invalid shield: ${state.player.shield}/${stats.shieldPoints}`);
  }

  if (!state.galaxy.sectors.has(state.currentSectorId)) {
    violations.push(`Invalid sector: ${state.currentSectorId}`);
  }

  if (state.player.turns < 0) {
    violations.push(`Negative turns: ${state.player.turns}`);
  }

  return violations;
}
