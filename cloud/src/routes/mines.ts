import type { D1Database } from '@cloudflare/workers-types';
import type { AuthContext } from '../utils/auth.js';
import { json, jsonError } from '../utils/cors.js';
import { resolveDefeat } from './combat.js';
import type { OperationStep } from './fighters.js';

const MINE_PRICES = {
  limpet: 300,
  armid: 500,
} as const;

const LIMPET_ATTACH_RATE = 0.12;
const LIMPET_ATTACH_CAP = 25;
const ARMID_DAMAGE_PER_MINE = 2;
const LIMPET_CLEAR_COST = 5000;

type MineType = 'limpet' | 'armid';

function asPositiveInt(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

function aggregateBlockadeLevel(score: number): 'none' | 'light' | 'active' | 'fortress' {
  if (score >= 5000) return 'fortress';
  if (score >= 2000) return 'active';
  if (score >= 500) return 'light';
  return 'none';
}

export async function getBlockadeMetadataForSector(
  db: D1Database,
  galaxyId: number,
  sectorId: number,
): Promise<{ blockadeLevel: 'none' | 'light' | 'active' | 'fortress'; blockadeScore: number; hostileDefenseEstimate: number }> {
  const fightersRow = await db
    .prepare('SELECT COALESCE(SUM(count), 0) as total FROM sector_fighters WHERE galaxy_id = ? AND sector_index = ?')
    .bind(galaxyId, sectorId)
    .first<{ total: number }>();

  const minesRow = await db
    .prepare('SELECT COALESCE(SUM(limpet_count), 0) as limpets, COALESCE(SUM(armid_count), 0) as armids FROM sector_mines WHERE galaxy_id = ? AND sector_index = ?')
    .bind(galaxyId, sectorId)
    .first<{ limpets: number; armids: number }>();

  const fighters = fightersRow?.total ?? 0;
  const limpets = minesRow?.limpets ?? 0;
  const armids = minesRow?.armids ?? 0;

  const score = fighters + limpets * 2 + armids * 5;

  return {
    blockadeLevel: aggregateBlockadeLevel(score),
    blockadeScore: score,
    hostileDefenseEstimate: fighters + limpets + armids,
  };
}

export async function applyMineEntryEffects(
  db: D1Database,
  playerId: number,
  galaxyId: number,
  targetSectorId: number,
): Promise<{ operations: OperationStep[]; destroyed: boolean; ship: Record<string, unknown> | null }> {
  const ship = await db
    .prepare('SELECT * FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
    .bind(playerId, galaxyId)
    .first<any>();

  if (!ship) {
    return {
      operations: [
        { step: 'limpet_mines', status: 'no_op', details: { reason: 'ship_not_found' } },
        { step: 'armid_mines', status: 'no_op', details: { reason: 'ship_not_found' } },
      ],
      destroyed: false,
      ship: null,
    };
  }

  const mineRows = await db
    .prepare('SELECT owner_id, limpet_count, armid_count FROM sector_mines WHERE galaxy_id = ? AND sector_index = ? AND owner_id != ?')
    .bind(galaxyId, targetSectorId, playerId)
    .all<{ owner_id: number; limpet_count: number; armid_count: number }>();

  const rows = mineRows.results ?? [];
  const totalLimpets = rows.reduce((sum, r) => sum + (r.limpet_count ?? 0), 0);
  const totalArmids = rows.reduce((sum, r) => sum + (r.armid_count ?? 0), 0);

  if (rows.length === 0 || (totalLimpets <= 0 && totalArmids <= 0)) {
    return {
      operations: [
        { step: 'limpet_mines', status: 'skipped_no_hostiles' },
        { step: 'armid_mines', status: 'skipped_no_hostiles' },
      ],
      destroyed: false,
      ship,
    };
  }

  let attached = Math.min(LIMPET_ATTACH_CAP, Math.floor(totalLimpets * LIMPET_ATTACH_RATE));
  if (totalLimpets > 0 && attached === 0 && Math.random() < 0.25) attached = 1;

  let remainingAttach = attached;
  for (const row of rows) {
    if (remainingAttach <= 0) break;
    const consume = Math.min(row.limpet_count, remainingAttach);
    if (consume <= 0) continue;

    await db
      .prepare('UPDATE sector_mines SET limpet_count = max(0, limpet_count - ?), deployed_at = datetime("now") WHERE galaxy_id = ? AND sector_index = ? AND owner_id = ?')
      .bind(consume, galaxyId, targetSectorId, row.owner_id)
      .run();
    remainingAttach -= consume;
  }

  const limpetAttached = (ship.limpet_attached ?? 0) + attached;
  await db
    .prepare('UPDATE player_ships SET limpet_attached = ?, updated_at = datetime("now") WHERE player_id = ? AND galaxy_id = ?')
    .bind(limpetAttached, playerId, galaxyId)
    .run();

  // Armid detonation (rough 50% chance)
  let detonated = 0;
  for (const row of rows) {
    if (row.armid_count <= 0) continue;
    const det = Math.max(0, Math.min(row.armid_count, Math.floor(row.armid_count * 0.5 + (Math.random() - 0.5) * Math.sqrt(row.armid_count))));
    detonated += det;
    if (det > 0) {
      await db
        .prepare('UPDATE sector_mines SET armid_count = max(0, armid_count - ?), deployed_at = datetime("now") WHERE galaxy_id = ? AND sector_index = ? AND owner_id = ?')
        .bind(det, galaxyId, targetSectorId, row.owner_id)
        .run();
    }
  }

  const hullDamage = detonated * ARMID_DAMAGE_PER_MINE;
  const nextHull = Math.max(0, (ship.hull ?? 0) - hullDamage);

  if (hullDamage > 0) {
    await db
      .prepare('UPDATE player_ships SET hull = ?, updated_at = datetime("now") WHERE player_id = ? AND galaxy_id = ?')
      .bind(nextHull, playerId, galaxyId)
      .run();
  }

  if (nextHull <= 0 && hullDamage > 0) {
    await resolveDefeat(db, galaxyId, playerId, targetSectorId, null, 'fighter');
    const respawned = await db.prepare('SELECT * FROM player_ships WHERE player_id = ? AND galaxy_id = ?').bind(playerId, galaxyId).first();

    return {
      operations: [
        {
          step: 'limpet_mines',
          status: attached > 0 ? 'resolved' : 'skipped_no_hostiles',
          details: { attached, totalHostileLimpets: totalLimpets, limpetAttached },
        },
        {
          step: 'armid_mines',
          status: 'resolved',
          details: { detonated, hullDamage, destroyed: true },
        },
      ],
      destroyed: true,
      ship: respawned,
    };
  }

  const updated = await db.prepare('SELECT * FROM player_ships WHERE player_id = ? AND galaxy_id = ?').bind(playerId, galaxyId).first();

  return {
    operations: [
      {
        step: 'limpet_mines',
        status: attached > 0 ? 'resolved' : 'skipped_no_hostiles',
        details: { attached, totalHostileLimpets: totalLimpets, limpetAttached },
      },
      {
        step: 'armid_mines',
        status: detonated > 0 ? 'resolved' : 'skipped_no_hostiles',
        details: { detonated, hullDamage, hullRemaining: nextHull, totalHostileArmids: totalArmids },
      },
    ],
    destroyed: false,
    ship: updated,
  };
}

/**
 * POST /api/mines/buy
 */
export async function handleBuyMines(auth: AuthContext, request: Request, db: D1Database): Promise<Response> {
  let body: { galaxyId?: number; type?: MineType; quantity?: number };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const galaxyId = body.galaxyId;
  const type = body.type;
  const quantity = asPositiveInt(body.quantity);

  if (!galaxyId || !type || !quantity) return jsonError('galaxyId, type, and positive quantity required');
  if (type !== 'limpet' && type !== 'armid') return jsonError('type must be limpet or armid');

  const ship = await db
    .prepare('SELECT credits, current_sector, limpets, armids FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
    .bind(auth.playerId, galaxyId)
    .first<{ credits: number; current_sector: number; limpets: number; armids: number }>();

  if (!ship) return jsonError('Ship not found', 404);

  const sector = await db
    .prepare('SELECT stardock FROM sectors WHERE galaxy_id = ? AND sector_index = ?')
    .bind(galaxyId, ship.current_sector)
    .first<{ stardock: number }>();

  if (!sector || sector.stardock !== 1) return jsonError('Mines can only be purchased at StarDock', 400);

  const cost = MINE_PRICES[type] * quantity;
  if (ship.credits < cost) return jsonError(`Need ${cost} credits (have ${ship.credits})`, 403);

  const column = type === 'limpet' ? 'limpets' : 'armids';
  await db
    .prepare(`UPDATE player_ships SET credits = credits - ?, ${column} = ${column} + ?, updated_at = datetime("now") WHERE player_id = ? AND galaxy_id = ?`)
    .bind(cost, quantity, auth.playerId, galaxyId)
    .run();

  return json({
    success: true,
    type,
    quantity,
    cost,
    remainingCredits: ship.credits - cost,
    shipLimpets: type === 'limpet' ? ship.limpets + quantity : ship.limpets,
    shipArmids: type === 'armid' ? ship.armids + quantity : ship.armids,
  });
}

/**
 * POST /api/mines/deploy
 */
export async function handleDeployMines(auth: AuthContext, request: Request, db: D1Database): Promise<Response> {
  let body: { galaxyId?: number; sectorId?: number; type?: MineType; quantity?: number };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const galaxyId = body.galaxyId;
  const sectorId = body.sectorId;
  const type = body.type;
  const quantity = asPositiveInt(body.quantity);

  if (!galaxyId || sectorId === undefined || !type || !quantity) {
    return jsonError('galaxyId, sectorId, type, and positive quantity required');
  }
  if (type !== 'limpet' && type !== 'armid') return jsonError('type must be limpet or armid');

  const ship = await db
    .prepare('SELECT current_sector, limpets, armids FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
    .bind(auth.playerId, galaxyId)
    .first<{ current_sector: number; limpets: number; armids: number }>();

  if (!ship) return jsonError('Ship not found', 404);
  if (ship.current_sector !== sectorId) return jsonError('Not in target sector', 403);

  const sector = await db
    .prepare('SELECT danger FROM sectors WHERE galaxy_id = ? AND sector_index = ?')
    .bind(galaxyId, sectorId)
    .first<{ danger: string }>();

  if (!sector) return jsonError('Sector not found', 404);
  if (sector.danger === 'safe') return jsonError('Cannot deploy mines in CHOAM Protected Space', 403);

  const column = type === 'limpet' ? 'limpets' : 'armids';
  const current = type === 'limpet' ? ship.limpets : ship.armids;
  if (current < quantity) return jsonError(`Not enough ${type} mines`, 403);

  const mineColumn = type === 'limpet' ? 'limpet_count' : 'armid_count';
  await db
    .prepare(
      `INSERT INTO sector_mines (galaxy_id, sector_index, owner_id, ${mineColumn})
       VALUES (?, ?, ?, ?)
       ON CONFLICT(galaxy_id, sector_index, owner_id)
       DO UPDATE SET
         ${mineColumn} = sector_mines.${mineColumn} + excluded.${mineColumn},
         deployed_at = datetime('now')`
    )
    .bind(galaxyId, sectorId, auth.playerId, quantity)
    .run();

  await db
    .prepare(`UPDATE player_ships SET ${column} = ${column} - ?, updated_at = datetime("now") WHERE player_id = ? AND galaxy_id = ?`)
    .bind(quantity, auth.playerId, galaxyId)
    .run();

  return json({ success: true, type, quantity });
}

/**
 * GET /api/mines/sector?galaxyId=&sectorId=
 */
export async function handleGetSectorMines(
  auth: AuthContext,
  galaxyId: string | null,
  sectorId: string | null,
  db: D1Database,
): Promise<Response> {
  if (!galaxyId || !sectorId) return jsonError('galaxyId and sectorId query params required');

  const gId = parseInt(galaxyId, 10);
  const sId = parseInt(sectorId, 10);
  if (Number.isNaN(gId) || Number.isNaN(sId)) return jsonError('Invalid galaxyId/sectorId');

  const rows = await db
    .prepare(
      `SELECT owner_id,
              COALESCE(SUM(limpet_count), 0) as limpets,
              COALESCE(SUM(armid_count), 0) as armids
       FROM sector_mines
       WHERE galaxy_id = ? AND sector_index = ?
       GROUP BY owner_id`
    )
    .bind(gId, sId)
    .all<{ owner_id: number; limpets: number; armids: number }>();

  const mines = (rows.results ?? []).map((r) => ({
    ownerId: r.owner_id,
    limpets: r.owner_id === auth.playerId ? r.limpets : undefined,
    armids: r.owner_id === auth.playerId ? r.armids : undefined,
    hostileEstimate: r.owner_id === auth.playerId ? 0 : r.limpets + r.armids,
    hostile: r.owner_id !== auth.playerId,
  }));

  const own = mines.find((m) => !m.hostile);
  const hostileEstimate = mines.filter((m) => m.hostile).reduce((sum, m) => sum + (m.hostileEstimate ?? 0), 0);

  return json({
    mines,
    own: own ?? { limpets: 0, armids: 0 },
    hostileEstimate,
  });
}

/**
 * POST /api/mines/clear-limpets
 */
export async function handleClearLimpets(auth: AuthContext, request: Request, db: D1Database): Promise<Response> {
  let body: { galaxyId?: number; sectorId?: number };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const galaxyId = body.galaxyId;
  const sectorId = body.sectorId;
  if (!galaxyId || sectorId === undefined) return jsonError('galaxyId and sectorId required');

  const ship = await db
    .prepare('SELECT current_sector, limpet_attached, credits FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
    .bind(auth.playerId, galaxyId)
    .first<{ current_sector: number; limpet_attached: number; credits: number }>();

  if (!ship) return jsonError('Ship not found', 404);
  if (ship.current_sector !== sectorId) return jsonError('Not in target sector', 403);

  const sector = await db
    .prepare('SELECT stardock FROM sectors WHERE galaxy_id = ? AND sector_index = ?')
    .bind(galaxyId, sectorId)
    .first<{ stardock: number }>();

  if (!sector || sector.stardock !== 1) return jsonError('Limpet removal only available at StarDock', 400);

  const attached = ship.limpet_attached ?? 0;
  if (attached <= 0) return jsonError('No limpets attached', 400);

  const cost = attached * LIMPET_CLEAR_COST;
  if (ship.credits < cost) return jsonError(`Need ${cost} credits to clear limpets`, 403);

  await db
    .prepare('UPDATE player_ships SET credits = credits - ?, limpet_attached = 0, updated_at = datetime("now") WHERE player_id = ? AND galaxy_id = ?')
    .bind(cost, auth.playerId, galaxyId)
    .run();

  return json({ success: true, removed: attached, cost, remainingCredits: ship.credits - cost });
}
