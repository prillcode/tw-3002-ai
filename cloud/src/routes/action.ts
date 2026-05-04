import type { D1Database } from '@cloudflare/workers-types';
import type { AuthContext } from '../utils/auth.js';
import { json, jsonError, actionBudgetExceededResponse } from '../utils/cors.js';
import { checkAndDeductActionPoints } from '../utils/actionBudget.js';
import { trackMissionProgress } from '../utils/dailyMissions.js';
import { UPGRADE_CATALOG, computeEffectiveStats } from '../upgrades.js';
import { resolveDefeat } from './combat.js';
import { applyAlignmentAndExperience } from '../utils/alignment.js';

interface CrimeStatus {
  canRob: boolean;
  alignment: number;
  experience: number;
  robLimit: number;
  stealLimit: number;
  bustBaseChance: number;
}

function getCrimeLimits(experience: number): { robLimit: number; stealLimit: number } {
  return {
    robLimit: Math.max(1500, 1500 + Math.floor(experience * 0.22)),
    stealLimit: Math.max(10, 10 + Math.floor(experience / 120)),
  };
}

function getBustChance(attempt: number, safeLimit: number): number {
  const base = 1 / 50;
  if (attempt <= safeLimit) return base;
  const overRatio = (attempt - safeLimit) / Math.max(1, safeLimit);
  return Math.min(0.9, base + overRatio * 0.25);
}

function estimatePortDisplayedCash(inventory: Record<string, { price: number; supply: number }>): number {
  return Object.values(inventory).reduce((sum, item) => sum + Math.max(0, item.price * item.supply), 0);
}

function removeCargoUnits(cargo: Record<string, number>, units: number): Record<string, number> {
  let remaining = Math.max(0, Math.floor(units));
  const next = { ...cargo };
  const keys = Object.keys(next).filter((k) => (next[k] ?? 0) > 0);
  for (const key of keys) {
    if (remaining <= 0) break;
    const owned = next[key] ?? 0;
    const take = Math.min(owned, remaining);
    next[key] = owned - take;
    if (next[key] <= 0) delete next[key];
    remaining -= take;
  }
  return next;
}

async function getCrimeStatusForPlayer(db: D1Database, playerId: number, galaxyId: number): Promise<CrimeStatus | null> {
  const ship = await db
    .prepare('SELECT alignment, experience FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
    .bind(playerId, galaxyId)
    .first<{ alignment: number; experience: number }>();

  if (!ship) return null;
  const limits = getCrimeLimits(ship.experience ?? 0);
  return {
    canRob: (ship.alignment ?? 0) <= -100,
    alignment: ship.alignment ?? 0,
    experience: ship.experience ?? 0,
    robLimit: limits.robLimit,
    stealLimit: limits.stealLimit,
    bustBaseChance: 1 / 50,
  };
}

/**
 * POST /api/action/trade
 * Body: { galaxyId, sectorId, commodity, quantity, action: 'buy' | 'sell' }
 */
export async function handleTrade(
  auth: AuthContext,
  request: Request,
  db: D1Database
): Promise<Response> {
  if (request.method !== 'POST') return jsonError('Method not allowed', 405);

  let body: {
    galaxyId?: number;
    sectorId?: number;
    commodity?: string;
    quantity?: number;
    action?: 'buy' | 'sell';
  };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const { galaxyId, sectorId, commodity, quantity, action } = body;
  if (!galaxyId || sectorId === undefined || !commodity || !quantity || !action) {
    return jsonError('galaxyId, sectorId, commodity, quantity, action required');
  }

  const budget = await checkAndDeductActionPoints(db, auth.playerId, galaxyId, 'trade');
  if (!budget.allowed) return actionBudgetExceededResponse(budget);

  const allowedCommodities = new Set(['ore', 'organics', 'equipment', 'melange']);
  if (!allowedCommodities.has(commodity)) {
    return jsonError('Invalid commodity', 400);
  }

  // Get ship
  const ship = await db
    .prepare('SELECT * FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
    .bind(auth.playerId, galaxyId)
    .first<{
      credits: number;
      cargo_json: string;
      current_sector: number;
    }>();

  if (!ship) return jsonError('Ship not found', 404);
  if (ship.current_sector !== sectorId) return jsonError('Not in target sector', 403);

  // Get port data
  const sector = await db
    .prepare('SELECT port_class, port_inventory_json FROM sectors WHERE galaxy_id = ? AND sector_index = ?')
    .bind(galaxyId, sectorId)
    .first<{ port_class: number | null; port_inventory_json: string }>();

  if (!sector || !sector.port_class) return jsonError('No port in this sector', 400);

  // Parse inventory
  const inventory: Record<string, { price: number; supply: number }> = JSON.parse(
    sector.port_inventory_json ?? '{}'
  );
  const item = inventory[commodity];
  if (!item) return jsonError('Commodity not available at this port', 400);

  // Parse cargo
  const cargo: Record<string, number> = JSON.parse(ship.cargo_json ?? '{}');
  const totalCargo = Object.values(cargo).reduce((a, b) => a + b, 0);

  if (action === 'buy') {
    const cost = item.price * quantity;
    if (ship.credits < cost) return jsonError('Insufficient credits', 403);
    if (item.supply < quantity) return jsonError('Port insufficient supply', 403);
    // TODO: max cargo check

    cargo[commodity] = (cargo[commodity] ?? 0) + quantity;
    item.supply -= quantity;
    item.price = Math.round(item.price * 1.02); // price rises as supply drops

    await db
      .prepare(
        'UPDATE player_ships SET credits = credits - ?, cargo_json = ?, updated_at = datetime("now") WHERE player_id = ? AND galaxy_id = ?'
      )
      .bind(cost, JSON.stringify(cargo), auth.playerId, galaxyId)
      .run();

    await db
      .prepare('UPDATE sectors SET port_inventory_json = ? WHERE galaxy_id = ? AND sector_index = ?')
      .bind(JSON.stringify(inventory), galaxyId, sectorId)
      .run();

    const expGain = Math.floor(cost / 20000);
    if (expGain > 0) {
      await applyAlignmentAndExperience(db, auth.playerId, galaxyId, { experienceDelta: expGain });
    }

    return json({ success: true, action: 'buy', commodity, quantity, cost, remainingCredits: ship.credits - cost, experienceGained: expGain });
  } else {
    // sell
    const owned = cargo[commodity] ?? 0;
    if (owned < quantity) return jsonError('Not enough cargo', 403);

    const revenue = item.price * quantity;
    cargo[commodity] = owned - quantity;
    if (cargo[commodity] === 0) delete cargo[commodity];
    item.supply += quantity;
    item.price = Math.round(item.price * 0.98); // price drops as supply rises

    await db
      .prepare(
        'UPDATE player_ships SET credits = credits + ?, cargo_json = ?, updated_at = datetime("now") WHERE player_id = ? AND galaxy_id = ?'
      )
      .bind(revenue, JSON.stringify(cargo), auth.playerId, galaxyId)
      .run();

    await db
      .prepare('UPDATE sectors SET port_inventory_json = ? WHERE galaxy_id = ? AND sector_index = ?')
      .bind(JSON.stringify(inventory), galaxyId, sectorId)
      .run();

    const expGain = Math.floor(revenue / 10000);
    if (expGain > 0) {
      await applyAlignmentAndExperience(db, auth.playerId, galaxyId, { experienceDelta: expGain });
    }

    // Track daily mission progress for trading
    await trackMissionProgress(db, auth.playerId, galaxyId, 'trade_credits', revenue);

    return json({ success: true, action: 'sell', commodity, quantity, revenue, remainingCredits: ship.credits + revenue, experienceGained: expGain });
  }
}

/**
 * GET /api/port/crime-status?galaxyId=&sectorId=
 */
export async function handleCrimeStatus(
  auth: AuthContext,
  galaxyIdParam: string | null,
  sectorIdParam: string | null,
  db: D1Database
): Promise<Response> {
  const galaxyId = Number(galaxyIdParam);
  const sectorId = Number(sectorIdParam);
  if (!Number.isFinite(galaxyId) || !Number.isFinite(sectorId)) {
    return jsonError('galaxyId and sectorId required', 400);
  }

  const sector = await db
    .prepare('SELECT port_class FROM sectors WHERE galaxy_id = ? AND sector_index = ?')
    .bind(galaxyId, sectorId)
    .first<{ port_class: number | null }>();
  if (!sector || !sector.port_class) return jsonError('No port in this sector', 400);

  const status = await getCrimeStatusForPlayer(db, auth.playerId, galaxyId);
  if (!status) return jsonError('Ship not found', 404);

  return json({ success: true, ...status });
}

/**
 * POST /api/action/rob
 * Body: { galaxyId, sectorId, amount }
 */
export async function handleRob(auth: AuthContext, request: Request, db: D1Database): Promise<Response> {
  if (request.method !== 'POST') return jsonError('Method not allowed', 405);

  let body: { galaxyId?: number; sectorId?: number; amount?: number };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const { galaxyId, sectorId, amount } = body;
  if (!galaxyId || sectorId === undefined || !amount || amount <= 0) {
    return jsonError('galaxyId, sectorId, amount required', 400);
  }

  const budget = await checkAndDeductActionPoints(db, auth.playerId, galaxyId, 'rob');
  if (!budget.allowed) return actionBudgetExceededResponse(budget);

  const ship = await db
    .prepare('SELECT credits, cargo_json, current_sector, alignment, experience FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
    .bind(auth.playerId, galaxyId)
    .first<{ credits: number; cargo_json: string; current_sector: number; alignment: number; experience: number }>();
  if (!ship) return jsonError('Ship not found', 404);
  if (ship.current_sector !== sectorId) return jsonError('Not in target sector', 403);

  const sector = await db
    .prepare('SELECT port_class, port_inventory_json FROM sectors WHERE galaxy_id = ? AND sector_index = ?')
    .bind(galaxyId, sectorId)
    .first<{ port_class: number | null; port_inventory_json: string }>();
  if (!sector || !sector.port_class) return jsonError('No port in this sector', 400);
  if ((ship.alignment ?? 0) > -100) return jsonError('Only Outlaws (alignment <= -100) can rob ports', 403);

  const inventory: Record<string, { price: number; supply: number }> = JSON.parse(sector.port_inventory_json ?? '{}');
  const displayedCash = estimatePortDisplayedCash(inventory);
  const actualCash = Math.floor(displayedCash * 1.11);
  const requested = Math.floor(amount);
  const stolen = Math.max(0, Math.min(requested, actualCash));
  if (stolen <= 0) return jsonError('Port has nothing worth stealing', 400);

  const { robLimit } = getCrimeLimits(ship.experience ?? 0);
  const bustChance = getBustChance(stolen, robLimit);
  const busted = Math.random() < bustChance;

  if (busted) {
    const xpLoss = Math.max(1, Math.floor((ship.experience ?? 0) * 0.1));
    const cargo = JSON.parse(ship.cargo_json ?? '{}') as Record<string, number>;
    const totalCargo = Object.values(cargo).reduce((a, b) => a + b, 0);
    const holdsLost = Math.min(totalCargo, Math.max(1, Math.floor(stolen / 1000)));
    const penalizedCargo = removeCargoUnits(cargo, holdsLost);

    await db
      .prepare('UPDATE player_ships SET cargo_json = ?, updated_at = datetime("now") WHERE player_id = ? AND galaxy_id = ?')
      .bind(JSON.stringify(penalizedCargo), auth.playerId, galaxyId)
      .run();

    await applyAlignmentAndExperience(db, auth.playerId, galaxyId, {
      alignmentDelta: -20,
      experienceDelta: -xpLoss,
    });

    await db
      .prepare('INSERT INTO news (galaxy_id, headline, type, sector_id, player_id) VALUES (?, ?, ?, ?, ?)')
      .bind(galaxyId, 'Port robbery busted by CHOAM security forces', 'crime', sectorId, auth.playerId)
      .run();

    return json({ success: true, busted: true, xpLost: xpLoss, holdsLost, bustChance });
  }

  await db
    .prepare('UPDATE player_ships SET credits = credits + ?, updated_at = datetime("now") WHERE player_id = ? AND galaxy_id = ?')
    .bind(stolen, auth.playerId, galaxyId)
    .run();

  await db
    .prepare('INSERT INTO news (galaxy_id, headline, type, sector_id, player_id) VALUES (?, ?, ?, ?, ?)')
    .bind(galaxyId, `Port robbery successful: ${stolen.toLocaleString()} credits stolen`, 'crime', sectorId, auth.playerId)
    .run();

  return json({ success: true, busted: false, stolen, bustChance, safeLimit: robLimit, requested, displayedCash, actualCash });
}

/**
 * POST /api/action/steal
 * Body: { galaxyId, sectorId, commodity, quantity }
 */
export async function handleSteal(auth: AuthContext, request: Request, db: D1Database): Promise<Response> {
  if (request.method !== 'POST') return jsonError('Method not allowed', 405);

  let body: { galaxyId?: number; sectorId?: number; commodity?: string; quantity?: number };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const { galaxyId, sectorId, commodity, quantity } = body;
  if (!galaxyId || sectorId === undefined || !commodity || !quantity || quantity <= 0) {
    return jsonError('galaxyId, sectorId, commodity, quantity required', 400);
  }

  const budget = await checkAndDeductActionPoints(db, auth.playerId, galaxyId, 'steal');
  if (!budget.allowed) return actionBudgetExceededResponse(budget);

  const allowedCommodities = new Set(['ore', 'organics', 'equipment', 'melange']);
  if (!allowedCommodities.has(commodity)) return jsonError('Invalid commodity', 400);

  const ship = await db
    .prepare('SELECT cargo_json, current_sector, alignment, experience, class_id, upgrades_json FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
    .bind(auth.playerId, galaxyId)
    .first<{ cargo_json: string; current_sector: number; alignment: number; experience: number; class_id: string; upgrades_json: string }>();
  if (!ship) return jsonError('Ship not found', 404);
  if (ship.current_sector !== sectorId) return jsonError('Not in target sector', 403);
  if ((ship.alignment ?? 0) > -100) return jsonError('Only Outlaws (alignment <= -100) can steal cargo', 403);

  const sector = await db
    .prepare('SELECT port_class, port_inventory_json FROM sectors WHERE galaxy_id = ? AND sector_index = ?')
    .bind(galaxyId, sectorId)
    .first<{ port_class: number | null; port_inventory_json: string }>();
  if (!sector || !sector.port_class) return jsonError('No port in this sector', 400);

  const cargo = JSON.parse(ship.cargo_json ?? '{}') as Record<string, number>;
  const totalCargo = Object.values(cargo).reduce((a, b) => a + b, 0);
  const upgrades = JSON.parse(ship.upgrades_json ?? '{}') as Record<string, number>;
  const maxCargo = computeEffectiveStats(ship.class_id, upgrades).maxCargo;
  if (totalCargo + quantity > maxCargo) {
    return jsonError(`Not enough cargo space (${maxCargo - totalCargo} free)`, 403);
  }

  const inventory: Record<string, { price: number; supply: number }> = JSON.parse(sector.port_inventory_json ?? '{}');
  const item = inventory[commodity];
  if (!item) return jsonError('Commodity not available at this port', 400);
  if ((item.supply ?? 0) < quantity) return jsonError('Port insufficient supply', 403);

  const { stealLimit } = getCrimeLimits(ship.experience ?? 0);
  const bustChance = getBustChance(quantity, stealLimit);
  const busted = Math.random() < bustChance;

  if (busted) {
    const xpLoss = Math.max(1, Math.floor((ship.experience ?? 0) * 0.1));
    const holdsLost = Math.max(1, Math.floor(quantity / 2));
    const penalizedCargo = removeCargoUnits(cargo, holdsLost);

    await db
      .prepare('UPDATE player_ships SET cargo_json = ?, updated_at = datetime("now") WHERE player_id = ? AND galaxy_id = ?')
      .bind(JSON.stringify(penalizedCargo), auth.playerId, galaxyId)
      .run();

    await applyAlignmentAndExperience(db, auth.playerId, galaxyId, {
      alignmentDelta: -15,
      experienceDelta: -xpLoss,
    });

    await db
      .prepare('INSERT INTO news (galaxy_id, headline, type, sector_id, player_id) VALUES (?, ?, ?, ?, ?)')
      .bind(galaxyId, 'Cargo theft busted by dock authorities', 'crime', sectorId, auth.playerId)
      .run();

    return json({ success: true, busted: true, xpLost: xpLoss, holdsLost, bustChance });
  }

  cargo[commodity] = (cargo[commodity] ?? 0) + quantity;
  item.supply -= quantity;

  await db
    .prepare('UPDATE player_ships SET cargo_json = ?, updated_at = datetime("now") WHERE player_id = ? AND galaxy_id = ?')
    .bind(JSON.stringify(cargo), auth.playerId, galaxyId)
    .run();
  await db
    .prepare('UPDATE sectors SET port_inventory_json = ? WHERE galaxy_id = ? AND sector_index = ?')
    .bind(JSON.stringify(inventory), galaxyId, sectorId)
    .run();

  await db
    .prepare('INSERT INTO news (galaxy_id, headline, type, sector_id, player_id) VALUES (?, ?, ?, ?, ?)')
    .bind(galaxyId, `Cargo theft successful: ${quantity} ${commodity} stolen`, 'crime', sectorId, auth.playerId)
    .run();

  return json({ success: true, busted: false, quantityStolen: quantity, commodity, bustChance, safeLimit: stealLimit });
}

/**
 * POST /api/action/combat
 * Body: { galaxyId, sectorId, enemyNpcId, playerAction: 'attack' | 'flee' | 'bribe' }
 */
export async function handleCombat(
  auth: AuthContext,
  request: Request,
  db: D1Database
): Promise<Response> {
  if (request.method !== 'POST') return jsonError('Method not allowed', 405);

  let body: {
    galaxyId?: number;
    sectorId?: number;
    enemyNpcId?: string;
    playerAction?: 'attack' | 'flee' | 'bribe';
  };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const { galaxyId, sectorId, enemyNpcId, playerAction } = body;
  if (!galaxyId || sectorId === undefined || !enemyNpcId || !playerAction) {
    return jsonError('galaxyId, sectorId, enemyNpcId, playerAction required');
  }

  const budget = await checkAndDeductActionPoints(db, auth.playerId, galaxyId, 'combat');
  if (!budget.allowed) return actionBudgetExceededResponse(budget);

  // Get ship and enemy
  const ship = await db
    .prepare('SELECT * FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
    .bind(auth.playerId, galaxyId)
    .first();
  if (!ship) return jsonError('Ship not found', 404);

  const enemy = await db
    .prepare('SELECT * FROM npcs WHERE galaxy_id = ? AND npc_id = ? AND current_sector = ?')
    .bind(galaxyId, enemyNpcId, sectorId)
    .first();
  if (!enemy) return jsonError('Enemy not found', 404);

  // Simple combat resolver (cloud-side)
  const shipJson = JSON.parse(enemy.ship_json as string);
  const enemyPersona = JSON.parse(enemy.persona_json as string) as { name: string; type: string; faction?: 'choam' | 'fremen' | 'sardaukar' | 'guild' | 'independent' };
  const enemyHull = shipJson.hull ?? 60;
  const enemyShield = shipJson.shield ?? 0;
  const enemyDmg = shipJson.weaponDamage ?? 5;
  const playerAlignment = Number((ship as any).alignment ?? 0);
  const sardaukarFocused = enemyPersona.faction === 'sardaukar' && playerAlignment >= 0;

  let result: {
    won: boolean;
    fled: boolean;
    bribed: boolean;
    playerHullRemaining: number;
    enemyHullRemaining: number;
    creditsGained: number;
    creditsLost: number;
    destroyed: boolean;
  };

  if (playerAction === 'flee') {
    const fleeChance = sardaukarFocused ? 0.12 : 0.35;
    const fled = Math.random() < fleeChance;
    if (fled) {
      result = { won: false, fled: true, bribed: false, playerHullRemaining: ship.hull as number, enemyHullRemaining: enemyHull, creditsGained: 0, creditsLost: 0, destroyed: false };
    } else {
      // Took damage while fleeing
      const dmg = Math.max(1, enemyDmg - (ship.shield as number) * 0.5);
      const newHull = Math.max(0, (ship.hull as number) - dmg);
      result = { won: false, fled: false, bribed: false, playerHullRemaining: newHull, enemyHullRemaining: enemyHull, creditsGained: 0, creditsLost: 0, destroyed: newHull <= 0 };
    }
  } else if (playerAction === 'bribe') {
    if (sardaukarFocused) {
      const dmg = Math.max(1, enemyDmg + 3 - (ship.shield as number) * 0.5);
      const newHull = Math.max(0, (ship.hull as number) - dmg);
      result = { won: false, fled: false, bribed: false, playerHullRemaining: newHull, enemyHullRemaining: enemyHull, creditsGained: 0, creditsLost: 0, destroyed: newHull <= 0 };
    } else {
      const bribeCost = Math.floor((ship.credits as number) * 0.1);
      result = { won: false, fled: false, bribed: true, playerHullRemaining: ship.hull as number, enemyHullRemaining: enemyHull, creditsGained: 0, creditsLost: bribeCost, destroyed: false };
    }
  } else {
    // Attack
    const playerDmg = 10; // TODO: compute from upgrades
    const newEnemyHull = Math.max(0, enemyHull - playerDmg);
    const enemyDmgDealt = Math.max(1, enemyDmg - (ship.shield as number) * 0.5);
    const newPlayerHull = Math.max(0, (ship.hull as number) - enemyDmgDealt);
    const won = newEnemyHull <= 0;
    const creditsGained = won ? Math.floor(Math.random() * 200 + 100) : 0;
    result = { won, fled: false, bribed: false, playerHullRemaining: newPlayerHull, enemyHullRemaining: newEnemyHull, creditsGained, creditsLost: 0, destroyed: newPlayerHull <= 0 };
  }

  // Apply results
  if (result.destroyed) {
    await resolveDefeat(db, galaxyId, auth.playerId, sectorId, null, 'npc');
  } else {
    await db
      .prepare(
        'UPDATE player_ships SET hull = ?, shield = ?, credits = credits + ? - ?, updated_at = datetime("now") WHERE player_id = ? AND galaxy_id = ?'
      )
      .bind(result.playerHullRemaining, ship.max_turns as number, result.creditsGained, result.creditsLost, auth.playerId, galaxyId)
      .run();
  }

  // Remove dead NPC
  if (result.won) {
    await db
      .prepare('UPDATE npcs SET is_active = 0 WHERE galaxy_id = ? AND npc_id = ?')
      .bind(galaxyId, enemyNpcId)
      .run();

    // Alignment + XP rewards/penalties based on faction identity
    let alignmentDelta = 0;
    if (enemyPersona.faction === 'sardaukar') alignmentDelta = 10;
    else if (enemyPersona.faction === 'fremen') alignmentDelta = -6;
    else if (enemyPersona.faction === 'choam' || enemyPersona.faction === 'guild') alignmentDelta = -10;
    else alignmentDelta = -2;

    const xpDelta = Math.max(5, Math.floor((enemyHull + enemyShield) / 4));
    await applyAlignmentAndExperience(db, auth.playerId, galaxyId, {
      alignmentDelta,
      experienceDelta: xpDelta,
    });

    // Track daily mission progress
    await trackMissionProgress(db, auth.playerId, galaxyId, 'kill_npcs', 1);
  }

  // Generate narrative
  const narrative = generateCombatNarrative(playerAction, result, enemyPersona.name, enemyPersona.type, enemyPersona.faction);

  return json({ result, narrative });
}

function generateCombatNarrative(
  action: 'attack' | 'flee' | 'bribe',
  result: { won: boolean; fled: boolean; bribed: boolean; destroyed: boolean; playerHullRemaining: number; creditsGained: number; creditsLost: number },
  enemyName: string,
  enemyType: string,
  enemyFaction?: 'choam' | 'fremen' | 'sardaukar' | 'guild' | 'independent',
): string {
  const templates: Record<string, string[]> = {
    'attack-won': [
      `Your cannons tear through ${enemyName}'s shields. They break apart in a shower of debris. +${result.creditsGained} cr looted.`,
      `A well-placed salvo cripples ${enemyName}. Their reactor goes critical and they vanish in a flash. +${result.creditsGained} cr.`,
      `${enemyName} tries to evade but your guns track true. The explosion lights up the void. +${result.creditsGained} cr.`,
      `You overload their shield grid. ${enemyName} breaks apart, scattering salvage across the sector. +${result.creditsGained} cr.`,
      `A barrage of fire punches through ${enemyName}'s hull. They go dark and drift. +${result.creditsGained} cr looted.`,
    ],
    'attack-lost': [
      `${enemyName}'s return fire is devastating. Your hull breaches and alarms scream. Ship destroyed!`,
      `You land a hit, but ${enemyName} is tougher than they look. Their counter-blow shatters your hull. Ship destroyed!`,
      `${enemyName} weaves through your fire and rips into your flank. The deck bucks and goes dark. Ship destroyed!`,
    ],
    'attack-survived': [
      `You exchange blows with ${enemyName}. Both ships are scarred but still flying. Hull at ${result.playerHullRemaining}.`,
      `${enemyName} absorbs your fire and returns it. You pull back, hull integrity at ${result.playerHullRemaining}.`,
      `The fight is a slugfest. ${enemyName} is damaged but so are you — hull at ${result.playerHullRemaining}.`,
    ],
    'flee-success': [
      `You fire retros and slingshot around debris. ${enemyName} can't match your turn rate. Clean escape!`,
      `A burst of thrust throws you into a dust cloud. ${enemyName} loses lock. You're clear!`,
      `You punch the engines and vanish into a sensor shadow. ${enemyName} drifts past, searching.`,
    ],
    'flee-fail': [
      `You punch the throttle but ${enemyName} anticipated the move. A blast catches your flank. Hull down to ${result.playerHullRemaining}.`,
      `Your maneuver is sloppy. ${enemyName} tracks you and lands a solid hit. Hull at ${result.playerHullRemaining}.`,
      `You nearly make it, but ${enemyName} clips your drive section. Sparks fly. Hull at ${result.playerHullRemaining}.`,
    ],
    'flee-death': [
      `You try to run but ${enemyName} is relentless. A final barrage tears your ship apart.`,
      `Your engines flare but ${enemyName} has the angle. They don't miss. Ship destroyed!`,
    ],
    'bribe': [
      `You transfer ${result.creditsLost} credits to ${enemyName}'s account. They power down weapons and let you pass.`,
      `${enemyName} scans the transfer and opens a comms channel: "Pleasure doing business."`,
      `The bribe is accepted. ${enemyName} turns away, leaving you alone in the dark.`,
      `Credits change hands. ${enemyName}'s targeting lasers go dark. You live to trade another day.`,
      `A quiet transaction. ${enemyName} spares you for ${result.creditsLost} credits.`,
    ],
  };

  let key: string;
  if (action === 'attack') {
    if (result.destroyed) key = 'attack-lost';
    else if (result.won) key = 'attack-won';
    else key = 'attack-survived';
  } else if (action === 'flee') {
    if (result.destroyed) key = 'flee-death';
    else if (result.fled) key = 'flee-success';
    else key = 'flee-fail';
  } else {
    key = 'bribe';
  }

  const factionVariants: Record<string, string[]> = {
    fremen: [
      `The desert warrior fights with fanatical intensity, striking like a crysknife in the dark.`,
      `${enemyName} moves with Fremen precision, reading your vectors before you commit.`
    ],
    sardaukar: [
      `The Sardaukar assault is relentless, a brutal hammer-blow that never pauses.`,
      `${enemyName} attacks with imperial discipline and murderous intent.`
    ],
    choam: [
      `The CHOAM patrol holds formation, disciplined fire stitching the void.`,
      `${enemyName} broadcasts a compliance warning before opening controlled volleys.`
    ],
    guild: [
      `A Guild sentinel keeps perfect spacing, firing in measured cadence.`,
      `${enemyName}'s gunnery is precise, almost ceremonial.`
    ],
    independent: [
      `The trader's guns blaze in desperation, fighting for one more run through the lanes.`,
      `${enemyName} is no soldier, but desperation makes them dangerous.`
    ],
  };

  const options = [...(templates[key] ?? ['The encounter ends in silence.'])];
  if (enemyFaction && action === 'attack') {
    options.push(...(factionVariants[enemyFaction] ?? []));
  }

  return options[Math.floor(Math.random() * options.length)];
}

/**
 * POST /api/action/upgrade
 * Body: { galaxyId, sectorId, upgradeId }
 */
export async function handleUpgrade(
  auth: AuthContext,
  request: Request,
  db: D1Database
): Promise<Response> {
  if (request.method !== 'POST') return jsonError('Method not allowed', 405);

  let body: {
    galaxyId?: number;
    sectorId?: number;
    upgradeId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const { galaxyId, sectorId, upgradeId } = body;
  if (!galaxyId || sectorId === undefined || !upgradeId) {
    return jsonError('galaxyId, sectorId, upgradeId required');
  }

  const budget = await checkAndDeductActionPoints(db, auth.playerId, galaxyId, 'upgrade');
  if (!budget.allowed) return actionBudgetExceededResponse(budget);

  // Verify sector has a stardock
  const sector = await db
    .prepare('SELECT stardock FROM sectors WHERE galaxy_id = ? AND sector_index = ?')
    .bind(galaxyId, sectorId)
    .first<{ stardock: number }>();

  if (!sector || sector.stardock !== 1) {
    return jsonError('No StarDock in this sector', 400);
  }

  // Get ship
  const ship = await db
    .prepare('SELECT * FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
    .bind(auth.playerId, galaxyId)
    .first<{
      credits: number;
      class_id: string;
      hull: number;
      shield: number;
      turns: number;
      max_turns: number;
      upgrades_json: string;
      current_sector: number;
    }>();

  if (!ship) return jsonError('Ship not found', 404);
  if (ship.current_sector !== sectorId) return jsonError('Not in target sector', 403);

  // Validate upgrade
  const upgrade = UPGRADE_CATALOG.find(u => u.id === upgradeId);
  if (!upgrade) return jsonError('Upgrade not found', 400);

  const upgrades: Record<string, number> = JSON.parse(ship.upgrades_json ?? '{}');
  if (upgrades[upgradeId]) return jsonError('Already purchased', 403);
  if (upgrade.prerequisite && !upgrades[upgrade.prerequisite]) {
    return jsonError(`Requires ${UPGRADE_CATALOG.find(u => u.id === upgrade.prerequisite)?.name ?? 'previous tier'}`, 403);
  }
  if (ship.credits < upgrade.cost) {
    return jsonError(`Need ${upgrade.cost} credits (have ${ship.credits})`, 403);
  }

  // Apply upgrade
  upgrades[upgradeId] = 1;
  const newCredits = ship.credits - upgrade.cost;
  const effectiveStats = computeEffectiveStats(ship.class_id, upgrades);

  await db
    .prepare(
      'UPDATE player_ships SET credits = ?, upgrades_json = ?, hull = ?, shield = ?, max_turns = ?, updated_at = datetime("now") WHERE player_id = ? AND galaxy_id = ?'
    )
    .bind(
      newCredits,
      JSON.stringify(upgrades),
      effectiveStats.maxHull,
      effectiveStats.shieldPoints,
      effectiveStats.maxTurns,
      auth.playerId,
      galaxyId
    )
    .run();

  return json({
    success: true,
    upgradeId,
    upgradeName: upgrade.name,
    remainingCredits: newCredits,
    stats: effectiveStats,
  });
}
