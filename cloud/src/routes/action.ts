import type { D1Database } from '@cloudflare/workers-types';
import type { AuthContext } from '../utils/auth.js';
import { json, jsonError } from '../utils/cors.js';

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

    return json({ success: true, action: 'buy', commodity, quantity, cost, remainingCredits: ship.credits - cost });
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

    return json({ success: true, action: 'sell', commodity, quantity, revenue, remainingCredits: ship.credits + revenue });
  }
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
  const enemyHull = shipJson.hull ?? 60;
  const enemyShield = shipJson.shield ?? 0;
  const enemyDmg = shipJson.weaponDamage ?? 5;

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
    const fleeChance = 0.35;
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
    const bribeCost = Math.floor((ship.credits as number) * 0.1);
    result = { won: false, fled: false, bribed: true, playerHullRemaining: ship.hull as number, enemyHullRemaining: enemyHull, creditsGained: 0, creditsLost: bribeCost, destroyed: false };
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
    const fedSpace = await db
      .prepare('SELECT sector_index FROM sectors WHERE galaxy_id = ? AND danger = "safe" ORDER BY sector_index LIMIT 1')
      .bind(galaxyId)
      .first<{ sector_index: number }>();

    await db
      .prepare(
        'UPDATE player_ships SET credits = floor(credits * 0.9), hull = max_turns, shield = 0, cargo_json = "{}", current_sector = ?, deaths = deaths + 1, updated_at = datetime("now") WHERE player_id = ? AND galaxy_id = ?'
      )
      .bind(fedSpace?.sector_index ?? 0, auth.playerId, galaxyId)
      .run();
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
  }

  return json({ result });
}
