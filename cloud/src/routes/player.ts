import type { D1Database } from '@cloudflare/workers-types';
import type { AuthContext } from '../utils/auth.js';
import { json, jsonError, actionBudgetExceededResponse } from '../utils/cors.js';
import { checkAndDeductActionPoints } from '../utils/actionBudget.js';
import { trackMissionProgress } from '../utils/dailyMissions.js';
import {
  baseEntryOperations,
  getEntryEncounter,
  resolveFighterEncounter,
  resolveShipToShipAfterEntry,
  type OperationStep,
} from './fighters.js';
import { applyMineEntryEffects } from './mines.js';
import { applyQCannonEntryEffects } from './planets.js';
import { applyAlignmentAndExperience, getFactionStanding, getRankInfo } from '../utils/alignment.js';

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
 * GET /api/player/alignment?galaxyId=
 */
export async function handleGetAlignment(
  auth: AuthContext,
  galaxyId: string | null,
  db: D1Database,
): Promise<Response> {
  if (!galaxyId) return jsonError('galaxyId query param required');

  const gId = parseInt(galaxyId, 10);
  if (Number.isNaN(gId)) return jsonError('Invalid galaxy id');

  const ship = await db
    .prepare('SELECT alignment, experience, rank, commissioned FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
    .bind(auth.playerId, gId)
    .first<{ alignment: number; experience: number; rank: number; commissioned: number }>();

  if (!ship) return jsonError('No ship found in this galaxy', 404);

  const standing = getFactionStanding(ship.alignment ?? 0);
  const rankInfo = getRankInfo(ship.experience ?? 0);

  return json({
    alignment: ship.alignment ?? 0,
    alignmentLabel: standing.alignmentLabel,
    factionStanding: standing.standing,
    experience: ship.experience ?? 0,
    rank: ship.rank ?? rankInfo.current.rank,
    rankTitle: rankInfo.current.title,
    nextRankExp: rankInfo.next?.minExperience ?? null,
    commissioned: (ship.commissioned ?? 0) === 1,
    canRob: standing.canRob,
    canBuyGuildNavigator: (ship.commissioned ?? 0) === 1,
    fremenNeutral: standing.fremenNeutral,
    sardaukarTarget: standing.sardaukarTarget,
  });
}

/**
 * POST /api/player/pay-taxes
 * Body: { galaxyId, amount }
 */
export async function handlePayTaxes(
  auth: AuthContext,
  request: Request,
  db: D1Database,
): Promise<Response> {
  let body: { galaxyId?: number; amount?: number };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const galaxyId = body.galaxyId;
  const amount = Math.floor(Number(body.amount ?? 0));
  if (!galaxyId || amount <= 0) return jsonError('galaxyId and positive amount required');
  if (amount < 1500) return jsonError('Minimum CHOAM tariff payment is 1,500 credits');

  const budget = await checkAndDeductActionPoints(db, auth.playerId, galaxyId, 'pay-taxes');
  if (!budget.allowed) return actionBudgetExceededResponse(budget);

  const ship = await db
    .prepare('SELECT credits, current_sector FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
    .bind(auth.playerId, galaxyId)
    .first<{ credits: number; current_sector: number }>();

  if (!ship) return jsonError('Ship not found', 404);
  if (ship.credits < amount) return jsonError(`Need ${amount} credits (have ${ship.credits})`, 403);

  const sector = await db
    .prepare('SELECT danger FROM sectors WHERE galaxy_id = ? AND sector_index = ?')
    .bind(galaxyId, ship.current_sector)
    .first<{ danger: string }>();

  if (!sector || sector.danger !== 'safe') {
    return jsonError('CHOAM tariffs can only be paid in CHOAM Protected Space', 403);
  }

  const alignmentGained = Math.max(1, Math.floor(amount / 1500));

  await db
    .prepare('UPDATE player_ships SET credits = credits - ?, updated_at = datetime("now") WHERE player_id = ? AND galaxy_id = ?')
    .bind(amount, auth.playerId, galaxyId)
    .run();

  const updated = await applyAlignmentAndExperience(db, auth.playerId, galaxyId, {
    alignmentDelta: alignmentGained,
    experienceDelta: Math.floor(amount / 5000),
  });

  // Track daily mission progress for paying taxes
  await trackMissionProgress(db, auth.playerId, galaxyId, 'pay_taxes', 1);

  return json({
    success: true,
    amountPaid: amount,
    alignmentGained,
    newAlignment: updated.alignment,
    remainingCredits: ship.credits - amount,
  });
}

/**
 * POST /api/player/commission
 * Body: { galaxyId }
 */
export async function handleRequestCommission(
  auth: AuthContext,
  request: Request,
  db: D1Database,
): Promise<Response> {
  let body: { galaxyId?: number };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const galaxyId = body.galaxyId;
  if (!galaxyId) return jsonError('galaxyId required');

  const budget = await checkAndDeductActionPoints(db, auth.playerId, galaxyId, 'commission');
  if (!budget.allowed) return actionBudgetExceededResponse(budget);

  const ship = await db
    .prepare('SELECT current_sector, alignment, commissioned FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
    .bind(auth.playerId, galaxyId)
    .first<{ current_sector: number; alignment: number; commissioned: number }>();

  if (!ship) return jsonError('Ship not found', 404);
  if ((ship.commissioned ?? 0) === 1) return jsonError('Already commissioned', 400);

  const sector = await db
    .prepare('SELECT stardock FROM sectors WHERE galaxy_id = ? AND sector_index = ?')
    .bind(galaxyId, ship.current_sector)
    .first<{ stardock: number }>();

  if (!sector || sector.stardock !== 1) return jsonError('Guild Commission can only be granted at StarDock', 403);
  if ((ship.alignment ?? 0) < 1000) return jsonError('Need +1000 alignment for Guild Commission', 403);

  const updated = await applyAlignmentAndExperience(db, auth.playerId, galaxyId, {
    setCommissioned: true,
    setAlignment: 1000,
    experienceDelta: 100,
  });

  return json({
    success: true,
    commissioned: true,
    alignment: updated.alignment,
    rank: updated.rank,
  });
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

  // Require email verification before creating a ship
  const player = await db
    .prepare('SELECT email_verified FROM players WHERE id = ?')
    .bind(auth.playerId)
    .first<{ email_verified: number }>();
  if (!player || player.email_verified !== 1) {
    return jsonError('Email verification required. Please verify your email before creating a ship.', 403);
  }

  const budget = await checkAndDeductActionPoints(db, auth.playerId, galaxyId, 'create-ship');
  if (!budget.allowed) return actionBudgetExceededResponse(budget);

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
           credits = 5000,
           current_sector = 0,
           cargo_json = '{}',
           hull = excluded.hull,
           shield = 0,
           turns = excluded.turns,
           max_turns = excluded.max_turns,
           upgrades_json = '{}',
           fighters = 30,
           limpets = 0,
           armids = 0,
           limpet_attached = 0,
           alignment = 0,
           experience = 0,
           rank = 1,
           commissioned = 0,
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

  const budget = await checkAndDeductActionPoints(db, auth.playerId, galaxyId, 'move');
  if (!budget.allowed) return actionBudgetExceededResponse(budget);

  // Verify sector exists and is connected
  const ship = await db
    .prepare('SELECT current_sector, turns, visited_sectors_json FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
    .bind(auth.playerId, galaxyId)
    .first<{ current_sector: number; turns: number; visited_sectors_json: string | null }>();

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

  const operations: OperationStep[] = baseEntryOperations();

  const mineEffects = await applyMineEntryEffects(db, auth.playerId, galaxyId, sectorId);
  for (const mineOp of mineEffects.operations) {
    const idx = operations.findIndex((op) => op.step === mineOp.step);
    if (idx >= 0) operations[idx] = mineOp;
    else operations.push(mineOp);
  }

  if (mineEffects.destroyed) {
    const qIdx = operations.findIndex((op) => op.step === 'q_cannon');
    if (qIdx >= 0) operations[qIdx] = { step: 'q_cannon', status: 'no_op', details: { reason: 'ship_destroyed_by_mines' } };

    operations.push({ step: 'fighters', status: 'no_op', details: { reason: 'ship_destroyed_by_mines' } });
    operations.push({ step: 'ship_to_ship', status: 'no_op', details: { reason: 'ship_destroyed_by_mines' } });
    return json({ ship: mineEffects.ship, moved: false, operations, destroyedByMines: true });
  }

  const qCannonEffects = await applyQCannonEntryEffects(db, auth.playerId, galaxyId, sectorId);
  const qIdx = operations.findIndex((op) => op.step === 'q_cannon');
  if (qIdx >= 0) operations[qIdx] = qCannonEffects.operation;
  else operations.push(qCannonEffects.operation);

  if (qCannonEffects.destroyed) {
    operations.push({ step: 'fighters', status: 'no_op', details: { reason: 'ship_destroyed_by_q_cannon' } });
    operations.push({ step: 'ship_to_ship', status: 'no_op', details: { reason: 'ship_destroyed_by_q_cannon' } });
    return json({ ship: qCannonEffects.ship, moved: false, operations, destroyedByQCannon: true });
  }

  const encounter = await getEntryEncounter(db, auth.playerId, galaxyId, sectorId);

  if (encounter) {
    // If all hostiles are offensive, resolve immediately as attack
    if (encounter.autoResolveOffensive) {
      const outcome = await resolveFighterEncounter(db, auth.playerId, galaxyId, sectorId, 'attack');
      if (!outcome.success) return jsonError(outcome.narrative, 400);

      operations.push({
        step: 'fighters',
        status: 'resolved',
        details: {
          outcome: outcome.outcome,
          hostileDestroyed: outcome.fighterLosses.hostile,
          playerLosses: outcome.fighterLosses.player,
          tollPaid: outcome.tollPaid,
        },
      });

      if (outcome.moved) {
        const shipCombat = await resolveShipToShipAfterEntry(db, auth.playerId, galaxyId, sectorId);
        operations.push(shipCombat.operation);

        return json({
          moved: !shipCombat.destroyed,
          encounterAutoResolved: true,
          outcome,
          operations,
          ship: shipCombat.ship,
        });
      }

      operations.push({ step: 'ship_to_ship', status: 'no_op', details: { reason: 'entry_failed' } });

      return json({
        moved: false,
        encounterAutoResolved: true,
        outcome,
        operations,
        ship: outcome.ship,
      });
    }

    operations.push({
      step: 'fighters',
      status: 'awaiting_player_choice',
      details: { hostileGroups: encounter.fighters.length, tollCredits: encounter.tollCredits },
    });
    operations.push({ step: 'ship_to_ship', status: 'no_op', details: { reason: 'pending_fighter_resolution' } });

    return json({
      error: 'fighter_encounter_required',
      ...encounter,
      operations,
    }, 409);
  }

  operations.push({ step: 'fighters', status: 'skipped_no_hostiles' });

  // Track visited sectors for daily missions
  const visited: number[] = JSON.parse(ship.visited_sectors_json ?? '[]');
  const isNewSector = !visited.includes(sectorId);
  if (isNewSector) {
    visited.push(sectorId);
  }

  // Update position and decrement turns
  await db
    .prepare(
      'UPDATE player_ships SET current_sector = ?, turns = turns - 1, shield = max_turns, visited_sectors_json = ?, updated_at = datetime("now") WHERE player_id = ? AND galaxy_id = ?'
    )
    .bind(sectorId, JSON.stringify(visited), auth.playerId, galaxyId)
    .run();

  // Track mission progress for visiting new sectors
  if (isNewSector) {
    await trackMissionProgress(db, auth.playerId, galaxyId, 'visit_sectors', 1);
  }

  const shipCombat = await resolveShipToShipAfterEntry(db, auth.playerId, galaxyId, sectorId);
  operations.push(shipCombat.operation);

  return json({ ship: shipCombat.ship, moved: !shipCombat.destroyed, operations });
}
