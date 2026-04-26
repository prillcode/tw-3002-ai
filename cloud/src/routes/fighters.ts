import type { D1Database } from '@cloudflare/workers-types';
import type { AuthContext } from '../utils/auth.js';
import { json, jsonError } from '../utils/cors.js';
import { resolveDefeat } from './combat.js';

const FIGHTER_PRICE = 100;
const TOLL_PER_FIGHTER = 5;
const MODES = new Set(['defensive', 'offensive', 'tolled']);

export type EncounterAction = 'attack' | 'retreat' | 'surrender' | 'pay_toll';

interface HostileFighterGroup {
  ownerId: number;
  ownerName: string;
  count: number;
  mode: 'defensive' | 'offensive' | 'tolled';
}

interface ShipSnapshot {
  player_id: number;
  galaxy_id: number;
  credits: number;
  fighters: number;
  hull: number;
  shield: number;
  max_turns: number;
  turns: number;
  current_sector: number;
}

function asPositiveInt(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

async function getShip(db: D1Database, playerId: number, galaxyId: number): Promise<ShipSnapshot | null> {
  return db
    .prepare(
      'SELECT player_id, galaxy_id, credits, fighters, hull, shield, max_turns, turns, current_sector FROM player_ships WHERE player_id = ? AND galaxy_id = ?'
    )
    .bind(playerId, galaxyId)
    .first<ShipSnapshot>();
}

async function getHostileFighters(
  db: D1Database,
  galaxyId: number,
  sectorId: number,
  playerId: number,
): Promise<HostileFighterGroup[]> {
  const rows = await db
    .prepare(
      `SELECT sf.owner_id, sf.count, sf.mode,
              COALESCE(p.display_name, p.email, ps.ship_name, 'Unknown Pilot') as owner_name
       FROM sector_fighters sf
       LEFT JOIN players p ON p.id = sf.owner_id
       LEFT JOIN player_ships ps ON ps.player_id = sf.owner_id AND ps.galaxy_id = sf.galaxy_id
       WHERE sf.galaxy_id = ? AND sf.sector_index = ? AND sf.owner_id != ? AND sf.count > 0
       ORDER BY sf.count DESC`
    )
    .bind(galaxyId, sectorId, playerId)
    .all<{ owner_id: number; owner_name: string; count: number; mode: 'defensive' | 'offensive' | 'tolled' }>();

  return (rows.results ?? []).map((r) => ({
    ownerId: r.owner_id,
    ownerName: r.owner_name,
    count: r.count,
    mode: r.mode,
  }));
}

function buildEncounterPayload(hostiles: HostileFighterGroup[], targetSector: number, shipCredits: number) {
  const tolledCount = hostiles.filter((h) => h.mode === 'tolled').reduce((sum, h) => sum + h.count, 0);
  const tollCredits = tolledCount * TOLL_PER_FIGHTER;
  const options: EncounterAction[] = ['attack', 'retreat', 'surrender'];

  if (tolledCount > 0) {
    options.push('pay_toll');
  }

  return {
    encounterRequired: true,
    targetSector,
    fighters: hostiles,
    options,
    tollCredits,
    canPayToll: shipCredits >= tollCredits,
  };
}

async function applyHostileLosses(
  db: D1Database,
  galaxyId: number,
  sectorId: number,
  hostiles: HostileFighterGroup[],
  totalLoss: number,
): Promise<void> {
  if (totalLoss <= 0 || hostiles.length === 0) return;

  const totalHostiles = hostiles.reduce((sum, h) => sum + h.count, 0);
  let remainingLoss = Math.min(totalLoss, totalHostiles);

  const allocations = hostiles.map((h, i) => {
    if (i === hostiles.length - 1) return remainingLoss;
    const share = Math.min(h.count, Math.floor((h.count / totalHostiles) * totalLoss));
    remainingLoss -= share;
    return share;
  });

  for (let i = 0; i < hostiles.length; i += 1) {
    const row = hostiles[i]!;
    const loss = Math.min(row.count, allocations[i] ?? 0);
    const next = row.count - loss;

    if (next <= 0) {
      await db
        .prepare('DELETE FROM sector_fighters WHERE galaxy_id = ? AND sector_index = ? AND owner_id = ?')
        .bind(galaxyId, sectorId, row.ownerId)
        .run();
    } else {
      await db
        .prepare('UPDATE sector_fighters SET count = ?, deployed_at = datetime("now") WHERE galaxy_id = ? AND sector_index = ? AND owner_id = ?')
        .bind(next, galaxyId, sectorId, row.ownerId)
        .run();
    }
  }
}

async function setShipState(
  db: D1Database,
  playerId: number,
  galaxyId: number,
  updates: {
    currentSector?: number;
    turnsDelta?: number;
    creditsDelta?: number;
    fighters?: number;
    hull?: number;
    shield?: number;
  },
): Promise<void> {
  const sets: string[] = [];
  const binds: Array<number> = [];

  if (updates.currentSector !== undefined) {
    sets.push('current_sector = ?');
    binds.push(updates.currentSector);
  }
  if (updates.turnsDelta !== undefined) {
    sets.push('turns = max(0, turns + ?)');
    binds.push(updates.turnsDelta);
  }
  if (updates.creditsDelta !== undefined) {
    sets.push('credits = max(0, credits + ?)');
    binds.push(updates.creditsDelta);
  }
  if (updates.fighters !== undefined) {
    sets.push('fighters = ?');
    binds.push(updates.fighters);
  }
  if (updates.hull !== undefined) {
    sets.push('hull = ?');
    binds.push(updates.hull);
  }
  if (updates.shield !== undefined) {
    sets.push('shield = ?');
    binds.push(updates.shield);
  }

  if (sets.length === 0) return;

  sets.push('updated_at = datetime("now")');

  await db
    .prepare(`UPDATE player_ships SET ${sets.join(', ')} WHERE player_id = ? AND galaxy_id = ?`)
    .bind(...binds, playerId, galaxyId)
    .run();
}

async function nearestFedSpaceSector(db: D1Database, galaxyId: number): Promise<number> {
  const row = await db
    .prepare('SELECT sector_index FROM sectors WHERE galaxy_id = ? AND danger = "safe" ORDER BY sector_index LIMIT 1')
    .bind(galaxyId)
    .first<{ sector_index: number }>();

  return row?.sector_index ?? 0;
}

export async function resolveFighterEncounter(
  db: D1Database,
  playerId: number,
  galaxyId: number,
  targetSectorId: number,
  action: EncounterAction,
): Promise<{
  success: boolean;
  outcome: 'entered' | 'retreated' | 'surrendered' | 'destroyed';
  moved: boolean;
  targetSectorId: number;
  narrative: string;
  fighterLosses: { player: number; hostile: number };
  tollPaid: number;
  ship: Record<string, unknown> | null;
}> {
  const ship = await getShip(db, playerId, galaxyId);
  if (!ship) return { success: false, outcome: 'retreated', moved: false, targetSectorId, narrative: 'Ship not found', fighterLosses: { player: 0, hostile: 0 }, tollPaid: 0, ship: null };

  const hostiles = await getHostileFighters(db, galaxyId, targetSectorId, playerId);
  if (hostiles.length === 0) {
    if (action === 'retreat') {
      await setShipState(db, playerId, galaxyId, { turnsDelta: -1 });
      const updated = await db.prepare('SELECT * FROM player_ships WHERE player_id = ? AND galaxy_id = ?').bind(playerId, galaxyId).first();
      return {
        success: true,
        outcome: 'retreated',
        moved: false,
        targetSectorId,
        narrative: 'No hostile fighters engaged. You hold position.',
        fighterLosses: { player: 0, hostile: 0 },
        tollPaid: 0,
        ship: updated,
      };
    }

    await setShipState(db, playerId, galaxyId, {
      currentSector: targetSectorId,
      turnsDelta: -1,
      shield: ship.max_turns,
    });
    const updated = await db.prepare('SELECT * FROM player_ships WHERE player_id = ? AND galaxy_id = ?').bind(playerId, galaxyId).first();
    return {
      success: true,
      outcome: 'entered',
      moved: true,
      targetSectorId,
      narrative: 'Sector clear. Warp successful.',
      fighterLosses: { player: 0, hostile: 0 },
      tollPaid: 0,
      ship: updated,
    };
  }

  const totalHostile = hostiles.reduce((sum, h) => sum + h.count, 0);
  const hasOffensive = hostiles.some((h) => h.mode === 'offensive');
  const tolledCount = hostiles.filter((h) => h.mode === 'tolled').reduce((sum, h) => sum + h.count, 0);
  const tollDue = tolledCount * TOLL_PER_FIGHTER;

  if (action === 'retreat') {
    await setShipState(db, playerId, galaxyId, { turnsDelta: -1 });
    const updated = await db.prepare('SELECT * FROM player_ships WHERE player_id = ? AND galaxy_id = ?').bind(playerId, galaxyId).first();
    return {
      success: true,
      outcome: 'retreated',
      moved: false,
      targetSectorId,
      narrative: 'You retreat before engagement. 1 turn spent.',
      fighterLosses: { player: 0, hostile: 0 },
      tollPaid: 0,
      ship: updated,
    };
  }

  if (action === 'surrender') {
    const fedSector = await nearestFedSpaceSector(db, galaxyId);
    await setShipState(db, playerId, galaxyId, {
      currentSector: fedSector,
      turnsDelta: -1,
      shield: ship.max_turns,
    });

    const updated = await db.prepare('SELECT * FROM player_ships WHERE player_id = ? AND galaxy_id = ?').bind(playerId, galaxyId).first();

    return {
      success: true,
      outcome: 'surrendered',
      moved: false,
      targetSectorId,
      narrative: `You surrender and are escorted to FedSpace (Sector ${fedSector}).`,
      fighterLosses: { player: 0, hostile: 0 },
      tollPaid: 0,
      ship: updated,
    };
  }

  if (action === 'pay_toll') {
    if (tolledCount <= 0) {
      return {
        success: false,
        outcome: 'retreated',
        moved: false,
        targetSectorId,
        narrative: 'No tolled fighters present in target sector.',
        fighterLosses: { player: 0, hostile: 0 },
        tollPaid: 0,
        ship: null,
      };
    }

    if (ship.credits < tollDue) {
      return {
        success: false,
        outcome: 'retreated',
        moved: false,
        targetSectorId,
        narrative: `Insufficient credits for toll (${tollDue}).`,
        fighterLosses: { player: 0, hostile: 0 },
        tollPaid: 0,
        ship: null,
      };
    }

    await setShipState(db, playerId, galaxyId, {
      currentSector: targetSectorId,
      turnsDelta: -1,
      creditsDelta: -tollDue,
      shield: ship.max_turns,
    });

    const updated = await db.prepare('SELECT * FROM player_ships WHERE player_id = ? AND galaxy_id = ?').bind(playerId, galaxyId).first();
    return {
      success: true,
      outcome: 'entered',
      moved: true,
      targetSectorId,
      narrative: `Toll paid (${tollDue} cr). Fighters stand down and you enter the sector.`,
      fighterLosses: { player: 0, hostile: 0 },
      tollPaid: tollDue,
      ship: updated,
    };
  }

  // attack path (and offensive auto-engagement)
  const offensiveMultiplier = hasOffensive ? 1.35 : 1.0;
  const playerForce = ship.hull + ship.shield + ship.fighters;
  const requiredForce = Math.ceil(totalHostile * (hasOffensive ? 1.25 : 1.0));

  const hostileLoss = Math.min(totalHostile, Math.max(1, Math.floor((playerForce / offensiveMultiplier) * 0.45)));
  const incomingDamage = Math.max(1, Math.floor(totalHostile * (hasOffensive ? 0.55 : 0.35)));

  const playerFighterLoss = Math.min(ship.fighters, incomingDamage);
  const overflowDamage = incomingDamage - playerFighterLoss;
  const newHull = Math.max(0, ship.hull - overflowDamage);
  const destroyed = newHull <= 0 || (hasOffensive && playerForce < requiredForce);

  await applyHostileLosses(db, galaxyId, targetSectorId, hostiles, hostileLoss);

  if (destroyed) {
    await resolveDefeat(db, galaxyId, playerId, targetSectorId, null, 'fighter');
    const updated = await db.prepare('SELECT * FROM player_ships WHERE player_id = ? AND galaxy_id = ?').bind(playerId, galaxyId).first();
    return {
      success: true,
      outcome: 'destroyed',
      moved: false,
      targetSectorId,
      narrative: 'Hostile fighters overwhelm your ship. You are destroyed and forced to respawn.',
      fighterLosses: { player: playerFighterLoss, hostile: hostileLoss },
      tollPaid: 0,
      ship: updated,
    };
  }

  await setShipState(db, playerId, galaxyId, {
    currentSector: targetSectorId,
    turnsDelta: -1,
    fighters: ship.fighters - playerFighterLoss,
    hull: newHull,
    shield: ship.max_turns,
  });

  const updated = await db.prepare('SELECT * FROM player_ships WHERE player_id = ? AND galaxy_id = ?').bind(playerId, galaxyId).first();
  return {
    success: true,
    outcome: 'entered',
    moved: true,
    targetSectorId,
    narrative: hasOffensive
      ? 'Offensive fighters strike hard, but you punch through and enter the sector.'
      : 'You engage the defending fighters and force a path into the sector.',
    fighterLosses: { player: playerFighterLoss, hostile: hostileLoss },
    tollPaid: 0,
    ship: updated,
  };
}

export async function getEntryEncounter(
  db: D1Database,
  playerId: number,
  galaxyId: number,
  targetSectorId: number,
): Promise<null | { encounterRequired: true; targetSector: number; fighters: HostileFighterGroup[]; options: EncounterAction[]; tollCredits: number; canPayToll: boolean; autoResolveOffensive: boolean }> {
  const ship = await getShip(db, playerId, galaxyId);
  if (!ship) return null;

  const hostiles = await getHostileFighters(db, galaxyId, targetSectorId, playerId);
  if (hostiles.length === 0) return null;

  const hasDecisionMode = hostiles.some((h) => h.mode === 'defensive' || h.mode === 'tolled');
  const payload = buildEncounterPayload(hostiles, targetSectorId, ship.credits);

  return {
    ...payload,
    autoResolveOffensive: !hasDecisionMode,
  };
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

/**
 * POST /api/fighters/encounter/resolve
 * Body: { galaxyId, targetSectorId, action }
 */
export async function handleResolveEncounter(
  auth: AuthContext,
  request: Request,
  db: D1Database,
): Promise<Response> {
  let body: { galaxyId?: number; targetSectorId?: number; action?: EncounterAction };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const galaxyId = body.galaxyId;
  const targetSectorId = body.targetSectorId;
  const action = body.action;

  if (!galaxyId || targetSectorId === undefined || !action) {
    return jsonError('galaxyId, targetSectorId, and action required');
  }

  const validActions: EncounterAction[] = ['attack', 'retreat', 'surrender', 'pay_toll'];
  if (!validActions.includes(action)) return jsonError('Invalid action');

  const ship = await getShip(db, auth.playerId, galaxyId);
  if (!ship) return jsonError('Ship not found', 404);
  if (ship.turns <= 0) return jsonError('Out of turns', 403);

  const currentSector = await db
    .prepare('SELECT connections_json FROM sectors WHERE galaxy_id = ? AND sector_index = ?')
    .bind(galaxyId, ship.current_sector)
    .first<{ connections_json: string }>();

  if (!currentSector) return jsonError('Current sector not found', 404);

  const connections: number[] = JSON.parse(currentSector.connections_json ?? '[]');
  if (!connections.includes(targetSectorId)) {
    return jsonError('Target sector no longer adjacent', 403);
  }

  const result = await resolveFighterEncounter(db, auth.playerId, galaxyId, targetSectorId, action);
  if (!result.success) return jsonError(result.narrative, 400);

  return json(result);
}
