import type { D1Database } from '@cloudflare/workers-types';
import type { AuthContext } from '../utils/auth.js';
import { json, jsonError } from '../utils/cors.js';
import { UPGRADE_CATALOG, computeEffectiveStats } from '../upgrades.js';
import { resolveDefeat } from './combat.js';
import { applyAlignmentAndExperience } from '../utils/alignment.js';

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

    return json({ success: true, action: 'sell', commodity, quantity, revenue, remainingCredits: ship.credits + revenue, experienceGained: expGain });
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
