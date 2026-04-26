import type { D1Database } from '@cloudflare/workers-types';
import type { AuthContext } from '../utils/auth.js';
import { json, jsonError } from '../utils/cors.js';
import { getEntryEncounter, resolveFighterEncounter } from './fighters.js';

/**
 * GET /api/player
 * Get current player profile.
 */
export async function handleGetPlayer(auth: AuthContext, db: D1Database): Promise<Response> {
  const player = await db
    .prepare('SELECT id, email, display_name, created_at FROM players WHERE id = ?')
    .bind(auth.playerId)
    .first();

  if (!player) return jsonError('Player not found', 404);

  return json({ player });
}

/**
 * GET /api/player/ship?galaxyId=
 * Get player's ship in a specific galaxy.
 */
export async function handleGetShip(
  auth: AuthContext,
  galaxyId: string | null,
  db: D1Database
): Promise<Response> {
  if (!galaxyId) return jsonError('galaxyId query param required');

  const gId = parseInt(galaxyId, 10);
  if (isNaN(gId)) return jsonError('Invalid galaxy id');

  const ship = await db
    .prepare('SELECT * FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
    .bind(auth.playerId, gId)
    .first<{
      turns: number;
      max_turns: number;
      last_action_at: string | null;
      [key: string]: any;
    }>();

  if (!ship) return jsonError('No ship found in this galaxy', 404);

  // Regenerate turns based on idle time
  const TURNS_PER_HOUR = 1;
  const now = new Date();
  const lastAction = ship.last_action_at ? new Date(ship.last_action_at) : now;
  const hoursIdle = Math.max(0, Math.floor((now.getTime() - lastAction.getTime()) / (1000 * 60 * 60)));
  const regenerated = hoursIdle * TURNS_PER_HOUR;
  const newTurns = Math.min(ship.max_turns, ship.turns + regenerated);

  if (regenerated > 0) {
    await db
      .prepare('UPDATE player_ships SET turns = ?, last_action_at = datetime("now") WHERE player_id = ? AND galaxy_id = ?')
      .bind(newTurns, auth.playerId, gId)
      .run();
  }

  return json({ ship: { ...ship, turns: newTurns, regenerated } });
}

/**
 * POST /api/player/ship
 * Create or update ship in a galaxy (join galaxy).
 * Body: { galaxyId, shipName, classId }
 */
export async function handleCreateShip(
  auth: AuthContext,
  request: Request,
  db: D1Database
): Promise<Response> {
  if (request.method !== 'POST') return jsonError('Method not allowed', 405);

  let body: { galaxyId?: number; shipName?: string; classId?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const galaxyId = body.galaxyId;
  const shipName = body.shipName?.trim();
  const classId = body.classId ?? 'merchant';

  if (!galaxyId || !shipName) return jsonError('galaxyId and shipName required');

  // Check if galaxy exists
  const galaxy = await db
    .prepare('SELECT id FROM galaxies WHERE id = ? AND active = 1')
    .bind(galaxyId)
    .first();
  if (!galaxy) return jsonError('Galaxy not found', 404);

  // Default stats per class
  const defaults: Record<string, { hull: number; turns: number; maxTurns: number }> = {
    merchant: { hull: 100, turns: 80, maxTurns: 80 },
    scout: { hull: 80, turns: 120, maxTurns: 120 },
    interceptor: { hull: 120, turns: 80, maxTurns: 80 },
  };
  const stats = defaults[classId] ?? defaults.merchant;

  try {
    await db
      .prepare(
        `INSERT INTO player_ships
         (player_id, galaxy_id, ship_name, class_id, credits, current_sector, hull, shield, turns, max_turns, cargo_json, upgrades_json, fighters)
         VALUES (?, ?, ?, ?, 5000, 0, ?, 0, ?, ?, '{}', '{}', 30)
         ON CONFLICT(player_id, galaxy_id) DO UPDATE SET
           ship_name = excluded.ship_name,
           class_id = excluded.class_id,
           updated_at = datetime('now')`
      )
      .bind(auth.playerId, galaxyId, shipName, classId, stats.hull, stats.turns, stats.maxTurns)
      .run();

    const ship = await db
      .prepare('SELECT * FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
      .bind(auth.playerId, galaxyId)
      .first();

    return json({ ship });
  } catch (err) {
    console.error('Create ship error:', err);
    return jsonError('Database error', 500);
  }
}

/**
 * POST /api/player/ship/move
 * Move ship to a new sector.
 * Body: { galaxyId, sectorId }
 */
export async function handleMoveShip(
  auth: AuthContext,
  request: Request,
  db: D1Database
): Promise<Response> {
  if (request.method !== 'POST') return jsonError('Method not allowed', 405);

  let body: { galaxyId?: number; sectorId?: number };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const galaxyId = body.galaxyId;
  const sectorId = body.sectorId;
  if (galaxyId === undefined || sectorId === undefined) {
    return jsonError('galaxyId and sectorId required');
  }

  // Verify sector exists and is connected
  const ship = await db
    .prepare('SELECT current_sector, turns FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
    .bind(auth.playerId, galaxyId)
    .first<{ current_sector: number; turns: number }>();

  if (!ship) return jsonError('Ship not found', 404);
  if (ship.turns <= 0) return jsonError('Out of turns', 403);

  // Check connection
  const currentSector = await db
    .prepare('SELECT connections_json FROM sectors WHERE galaxy_id = ? AND sector_index = ?')
    .bind(galaxyId, ship.current_sector)
    .first<{ connections_json: string }>();

  if (!currentSector) return jsonError('Current sector not found', 404);

  const connections: number[] = JSON.parse(currentSector.connections_json ?? '[]');
  if (!connections.includes(sectorId)) {
    return jsonError('Sector not connected', 403);
  }

  const encounter = await getEntryEncounter(db, auth.playerId, galaxyId, sectorId);

  if (encounter) {
    // If all hostiles are offensive, resolve immediately as attack
    if (encounter.autoResolveOffensive) {
      const outcome = await resolveFighterEncounter(db, auth.playerId, galaxyId, sectorId, 'attack');
      if (!outcome.success) return jsonError(outcome.narrative, 400);

      return json({
        moved: outcome.moved,
        encounterAutoResolved: true,
        outcome,
        ship: outcome.ship,
      });
    }

    return json({
      error: 'fighter_encounter_required',
      ...encounter,
    }, 409);
  }

  // Update position and decrement turns
  await db
    .prepare(
      'UPDATE player_ships SET current_sector = ?, turns = turns - 1, shield = max_turns, updated_at = datetime("now") WHERE player_id = ? AND galaxy_id = ?'
    )
    .bind(sectorId, auth.playerId, galaxyId)
    .run();

  const updated = await db
    .prepare('SELECT * FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
    .bind(auth.playerId, galaxyId)
    .first();

  return json({ ship: updated, moved: true });
}
