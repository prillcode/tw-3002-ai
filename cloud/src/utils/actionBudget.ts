/**
 * Action budget — per-player, D1-backed.
 *
 * Players get 60 action points (cap), regenerating 1 per minute.
 * Gameplay actions deduct points. Returns 403 on insufficient balance.
 */

import type { D1Database } from '@cloudflare/workers-types';

export interface ActionBudgetResult {
  allowed: boolean;
  remaining: number;
  nextRefillMinutes: number; // 0 if allowed, minutes until enough if not
}

/** Action names and their point costs. */
const ACTION_COSTS: Record<string, number> = {
  'move': 1,
  'trade': 1,
  'combat': 2,
  'rob': 2,
  'steal': 1,
  'upgrade': 1,
  'create-ship': 1,
  'pay-taxes': 1,
  'commission': 1,
  'insurance-buy': 0, // purchase, not an action
  'add-news': 1,
  'fighters-buy': 1,
  'fighters-deploy': 1,
  'fighters-recall': 1,
  'encounter-resolve': 2,
  'planet-create': 2,
  'planet-colonize': 2,
  'citadel-advance': 1,
  'qcannon': 1,
  'planet-transport': 1,
  'mines-buy': 1,
  'mines-deploy': 1,
  'clear-limpets': 1,
};

const MAX_POINTS = 60;

export async function checkAndDeductActionPoints(
  db: D1Database,
  playerId: number,
  galaxyId: number,
  action: string,
): Promise<ActionBudgetResult> {
  const cost = ACTION_COSTS[action] ?? 1;

  const ship = await db
    .prepare(
      'SELECT action_points, action_points_refill_at FROM player_ships WHERE player_id = ? AND galaxy_id = ?',
    )
    .bind(playerId, galaxyId)
    .first<{
      action_points: number;
      action_points_refill_at: string | null;
    }>();

  if (!ship) {
    return { allowed: false, remaining: 0, nextRefillMinutes: 0 };
  }

  // Calculate regenerated points
  const now = new Date();
  let points = ship.action_points;

  if (ship.action_points_refill_at) {
    const refillAt = new Date(ship.action_points_refill_at);
    const elapsedMs = now.getTime() - refillAt.getTime();
    const elapsedMinutes = Math.floor(elapsedMs / 60_000);
    points = Math.min(MAX_POINTS, points + elapsedMinutes);
  }

  if (points < cost) {
    const needed = cost - points;
    return {
      allowed: false,
      remaining: points,
      nextRefillMinutes: needed, // 1 pt/min, so needed minutes = needed points
    };
  }

  const newPoints = points - cost;
  const newRefillAt = now.toISOString();

  await db
    .prepare(
      'UPDATE player_ships SET action_points = ?, action_points_refill_at = ? WHERE player_id = ? AND galaxy_id = ?',
    )
    .bind(newPoints, newRefillAt, playerId, galaxyId)
    .run();

  return { allowed: true, remaining: newPoints, nextRefillMinutes: 0 };
}
