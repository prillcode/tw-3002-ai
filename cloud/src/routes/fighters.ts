import type { D1Database } from '@cloudflare/workers-types';
import type { AuthContext } from '../utils/auth.js';
import { json, jsonError } from '../utils/cors.js';

const FIGHTER_PRICE = 100;
const MODES = new Set(['defensive', 'offensive', 'tolled']);

function asPositiveInt(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

/**
 * POST /api/fighters/buy
 * Body: { galaxyId, quantity }
 */
export async function handleBuyFighters(
  auth: AuthContext,
  request: Request,
  db: D1Database,
): Promise<Response> {
  let body: { galaxyId?: number; quantity?: number };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const galaxyId = body.galaxyId;
  const quantity = asPositiveInt(body.quantity);
  if (!galaxyId || !quantity) return jsonError('galaxyId and positive quantity required');

  const ship = await db
    .prepare('SELECT credits, fighters, current_sector FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
    .bind(auth.playerId, galaxyId)
    .first<{ credits: number; fighters: number; current_sector: number }>();

  if (!ship) return jsonError('Ship not found', 404);

  const sector = await db
    .prepare('SELECT stardock FROM sectors WHERE galaxy_id = ? AND sector_index = ?')
    .bind(galaxyId, ship.current_sector)
    .first<{ stardock: number }>();

  if (!sector || sector.stardock !== 1) {
    return jsonError('Fighters can only be purchased at StarDock', 400);
  }

  const cost = quantity * FIGHTER_PRICE;
  if (ship.credits < cost) {
    return jsonError(`Need ${cost} credits (have ${ship.credits})`, 403);
  }

  await db
    .prepare('UPDATE player_ships SET credits = credits - ?, fighters = fighters + ?, updated_at = datetime("now") WHERE player_id = ? AND galaxy_id = ?')
    .bind(cost, quantity, auth.playerId, galaxyId)
    .run();

  return json({
    success: true,
    quantity,
    cost,
    remainingCredits: ship.credits - cost,
    shipFighters: ship.fighters + quantity,
  });
}

/**
 * POST /api/fighters/deploy
 * Body: { galaxyId, sectorId, quantity, mode }
 */
export async function handleDeployFighters(
  auth: AuthContext,
  request: Request,
  db: D1Database,
): Promise<Response> {
  let body: { galaxyId?: number; sectorId?: number; quantity?: number; mode?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const galaxyId = body.galaxyId;
  const sectorId = body.sectorId;
  const quantity = asPositiveInt(body.quantity);
  const mode = (body.mode ?? 'defensive').toLowerCase();

  if (!galaxyId || sectorId === undefined || !quantity) {
    return jsonError('galaxyId, sectorId, and positive quantity required');
  }
  if (!MODES.has(mode)) return jsonError('Invalid mode. Use defensive, offensive, or tolled');

  const ship = await db
    .prepare('SELECT fighters, current_sector FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
    .bind(auth.playerId, galaxyId)
    .first<{ fighters: number; current_sector: number }>();

  if (!ship) return jsonError('Ship not found', 404);
  if (ship.current_sector !== sectorId) return jsonError('Not in target sector', 403);
  if (ship.fighters < quantity) return jsonError('Not enough carried fighters', 403);

  const sector = await db
    .prepare('SELECT danger FROM sectors WHERE galaxy_id = ? AND sector_index = ?')
    .bind(galaxyId, sectorId)
    .first<{ danger: string }>();

  if (!sector) return jsonError('Sector not found', 404);
  if (sector.danger === 'safe') return jsonError('Cannot deploy fighters in FedSpace', 403);

  await db
    .prepare(
      `INSERT INTO sector_fighters (galaxy_id, sector_index, owner_id, count, mode)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(galaxy_id, sector_index, owner_id)
       DO UPDATE SET
         count = sector_fighters.count + excluded.count,
         mode = excluded.mode,
         deployed_at = datetime('now')`
    )
    .bind(galaxyId, sectorId, auth.playerId, quantity, mode)
    .run();

  await db
    .prepare('UPDATE player_ships SET fighters = fighters - ?, updated_at = datetime("now") WHERE player_id = ? AND galaxy_id = ?')
    .bind(quantity, auth.playerId, galaxyId)
    .run();

  const own = await db
    .prepare('SELECT count, mode FROM sector_fighters WHERE galaxy_id = ? AND sector_index = ? AND owner_id = ?')
    .bind(galaxyId, sectorId, auth.playerId)
    .first<{ count: number; mode: string }>();

  return json({
    success: true,
    quantity,
    mode,
    remainingShipFighters: ship.fighters - quantity,
    sectorFighters: own?.count ?? 0,
    sectorMode: own?.mode ?? mode,
  });
}

/**
 * GET /api/fighters/sector?galaxyId=&sectorId=
 */
export async function handleGetSectorFighters(
  auth: AuthContext,
  galaxyId: string | null,
  sectorId: string | null,
  db: D1Database,
): Promise<Response> {
  if (!galaxyId || !sectorId) return jsonError('galaxyId and sectorId query params required');

  const gId = parseInt(galaxyId, 10);
  const sId = parseInt(sectorId, 10);
  if (Number.isNaN(gId) || Number.isNaN(sId)) return jsonError('Invalid galaxyId/sectorId');

  const result = await db
    .prepare(
      `SELECT sf.owner_id, sf.count, sf.mode, sf.deployed_at,
              COALESCE(p.display_name, p.email, ps.ship_name, 'Unknown Pilot') as owner_name
       FROM sector_fighters sf
       LEFT JOIN players p ON p.id = sf.owner_id
       LEFT JOIN player_ships ps ON ps.player_id = sf.owner_id AND ps.galaxy_id = sf.galaxy_id
       WHERE sf.galaxy_id = ? AND sf.sector_index = ?
       ORDER BY sf.count DESC`
    )
    .bind(gId, sId)
    .all<{
      owner_id: number;
      owner_name: string;
      count: number;
      mode: string;
      deployed_at: string;
    }>();

  const fighters = (result.results ?? []).map((r) => ({
    ownerId: r.owner_id,
    ownerName: r.owner_name,
    count: r.count,
    mode: r.mode,
    deployedAt: r.deployed_at,
    hostile: r.owner_id !== auth.playerId,
  }));

  return json({ fighters });
}

/**
 * POST /api/fighters/recall
 * Body: { galaxyId, sectorId, quantity }
 */
export async function handleRecallFighters(
  auth: AuthContext,
  request: Request,
  db: D1Database,
): Promise<Response> {
  let body: { galaxyId?: number; sectorId?: number; quantity?: number };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const galaxyId = body.galaxyId;
  const sectorId = body.sectorId;
  if (!galaxyId || sectorId === undefined) return jsonError('galaxyId and sectorId required');

  const ship = await db
    .prepare('SELECT current_sector, fighters FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
    .bind(auth.playerId, galaxyId)
    .first<{ current_sector: number; fighters: number }>();

  if (!ship) return jsonError('Ship not found', 404);
  if (ship.current_sector !== sectorId) return jsonError('Not in target sector', 403);

  const deployed = await db
    .prepare('SELECT count FROM sector_fighters WHERE galaxy_id = ? AND sector_index = ? AND owner_id = ?')
    .bind(galaxyId, sectorId, auth.playerId)
    .first<{ count: number }>();

  if (!deployed || deployed.count <= 0) return jsonError('No deployed fighters in this sector', 404);

  const quantity = body.quantity == null ? deployed.count : asPositiveInt(body.quantity);
  if (!quantity) return jsonError('quantity must be a positive integer');
  if (quantity > deployed.count) return jsonError('Cannot recall more than deployed', 403);

  const remaining = deployed.count - quantity;

  if (remaining === 0) {
    await db
      .prepare('DELETE FROM sector_fighters WHERE galaxy_id = ? AND sector_index = ? AND owner_id = ?')
      .bind(galaxyId, sectorId, auth.playerId)
      .run();
  } else {
    await db
      .prepare('UPDATE sector_fighters SET count = ?, deployed_at = datetime("now") WHERE galaxy_id = ? AND sector_index = ? AND owner_id = ?')
      .bind(remaining, galaxyId, sectorId, auth.playerId)
      .run();
  }

  await db
    .prepare('UPDATE player_ships SET fighters = fighters + ?, updated_at = datetime("now") WHERE player_id = ? AND galaxy_id = ?')
    .bind(quantity, auth.playerId, galaxyId)
    .run();

  return json({
    success: true,
    quantity,
    shipFighters: ship.fighters + quantity,
    sectorFighters: remaining,
  });
}
