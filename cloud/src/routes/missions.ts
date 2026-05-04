/**
 * Daily mission API routes.
 *
 * GET  /api/player/missions?galaxyId=     — list today's missions
 * POST /api/player/missions/claim          — claim reward for completed mission
 * POST /api/player/missions/reroll         — reroll a mission (costs credits)
 */

import type { D1Database } from '@cloudflare/workers-types';
import type { AuthContext } from '../utils/auth.js';
import { json, jsonError } from '../utils/cors.js';
import { getTodaysMissions, claimMissionReward, rerollMission } from '../utils/dailyMissions.js';

/**
 * GET /api/player/missions?galaxyId=
 */
export async function handleGetMissions(
  auth: AuthContext,
  galaxyId: string | null,
  db: D1Database,
): Promise<Response> {
  if (!galaxyId) return jsonError('galaxyId query param required');

  const gId = parseInt(galaxyId, 10);
  if (isNaN(gId)) return jsonError('Invalid galaxy id');

  const result = await getTodaysMissions(db, auth.playerId, gId);
  return json(result);
}

/**
 * POST /api/player/missions/claim
 * Body: { galaxyId, missionId }
 */
export async function handleClaimMission(
  auth: AuthContext,
  request: Request,
  db: D1Database,
): Promise<Response> {
  if (request.method !== 'POST') return jsonError('Method not allowed', 405);

  let body: { galaxyId?: number; missionId?: number };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const { galaxyId, missionId } = body;
  if (!galaxyId || !missionId) return jsonError('galaxyId and missionId required');

  const result = await claimMissionReward(db, auth.playerId, galaxyId, missionId);
  if (!result.success) return jsonError(result.error ?? 'Claim failed', 400);

  return json(result);
}

/**
 * POST /api/player/missions/reroll
 * Body: { galaxyId, missionId }
 */
export async function handleRerollMission(
  auth: AuthContext,
  request: Request,
  db: D1Database,
): Promise<Response> {
  if (request.method !== 'POST') return jsonError('Method not allowed', 405);

  let body: { galaxyId?: number; missionId?: number };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const { galaxyId, missionId } = body;
  if (!galaxyId || !missionId) return jsonError('galaxyId and missionId required');

  const result = await rerollMission(db, auth.playerId, galaxyId, missionId);
  if (!result.success) return jsonError(result.error ?? 'Reroll failed', 400);

  return json(result);
}
