/**
 * Planet routes — creation, colonization, production, citadel advancement
 * TW-14: Planets & Citadels
 */
import type { D1Database } from '@cloudflare/workers-types';
import { json, jsonError } from '../utils/cors.js';
import { verifyToken, type AuthContext } from '../utils/auth.js';

// ─── Planet class configuration ────────────────────────────────────

interface PlanetClassConfig {
  name: string;
  description: string;
  maxColonists: number;
  fuelRatio: number;
  orgRatio: number;
  eqRatio: number;
  maxDailyFuel: number;
  maxDailyOrg: number;
  maxDailyEq: number;
  fighterDivisor: number; // n/X means X colonists per fighter
  productionCaps: { fuel: number; org: number; eq: number };
}

const PLANET_CLASSES: Record<string, PlanetClassConfig> = {
  M: {
    name: 'Earth Type',
    description: 'Balanced production. Good for organics and equipment.',
    maxColonists: 30_000,
    fuelRatio: 3, orgRatio: 7, eqRatio: 13,
    maxDailyFuel: 5_000, maxDailyOrg: 2_142, maxDailyEq: 1_153,
    fighterDivisor: 10,
    productionCaps: { fuel: 100_000, org: 100_000, eq: 100_000 },
  },
  K: {
    name: 'Desert',
    description: 'Excellent fuel ore. Very poor organics and equipment.',
    maxColonists: 40_000,
    fuelRatio: 2, orgRatio: 100, eqRatio: 500,
    maxDailyFuel: 10_000, maxDailyOrg: 200, maxDailyEq: 40,
    fighterDivisor: 15,
    productionCaps: { fuel: 200_000, org: 50_000, eq: 10_000 },
  },
  O: {
    name: 'Oceanic',
    description: 'Massive organics production. Poor equipment.',
    maxColonists: 200_000,
    fuelRatio: 20, orgRatio: 2, eqRatio: 100,
    maxDailyFuel: 5_000, maxDailyOrg: 50_000, maxDailyEq: 1_000,
    fighterDivisor: 15,
    productionCaps: { fuel: 100_000, org: 1_000_000, eq: 50_000 },
  },
  L: {
    name: 'Mountainous',
    description: 'Best fighter production. Balanced fuel and organics.',
    maxColonists: 40_000,
    fuelRatio: 2, orgRatio: 5, eqRatio: 20,
    maxDailyFuel: 10_000, maxDailyOrg: 4_000, maxDailyEq: 1_000,
    fighterDivisor: 12,
    productionCaps: { fuel: 200_000, org: 200_000, eq: 200_000 },
  },
  C: {
    name: 'Glacial',
    description: 'Low production all around. Often used as penal colonies.',
    maxColonists: 100_000,
    fuelRatio: 50, orgRatio: 100, eqRatio: 500,
    maxDailyFuel: 1_000, maxDailyOrg: 500, maxDailyEq: 100,
    fighterDivisor: 25,
    productionCaps: { fuel: 20_000, org: 50_000, eq: 10_000 },
  },
  H: {
    name: 'Volcanic',
    description: 'Massive fuel reserves. No organics. Excellent for fuel farming.',
    maxColonists: 100_000,
    fuelRatio: 1, orgRatio: 0, eqRatio: 500,
    maxDailyFuel: 50_000, maxDailyOrg: 0, maxDailyEq: 100,
    fighterDivisor: 50,
    productionCaps: { fuel: 1_000_000, org: 10_000, eq: 100_000 },
  },
  U: {
    name: 'Gas',
    description: 'No production possible. Thin-air colonies only.',
    maxColonists: 3_000,
    fuelRatio: 0, orgRatio: 0, eqRatio: 0,
    maxDailyFuel: 0, maxDailyOrg: 0, maxDailyEq: 0,
    fighterDivisor: 0,
    productionCaps: { fuel: 10_000, org: 10_000, eq: 10_000 },
  },
};

// Base probability weights for planet class
const BASE_WEIGHTS: Record<string, number> = {
  M: 25, K: 15, O: 15, L: 20, C: 10, H: 10, U: 5,
};

const GENESIS_TORPEDO_COST = 80_000;
const MAX_PLANETS_PER_SECTOR = 5;
const COLONIST_TRANSPORT_COST_PER_UNIT = 5; // credits per colonist
const COLONIST_FUEL_COST_PER_SECTOR = 10; // fuel per sector distance

// ─── Helpers ────────────────────────────────────────────────────────

function rollPlanetClass(existingPlanetsInSector: number): string {
  // Each existing planet shifts 5% toward U-class
  const uShift = existingPlanetsInSector * 5;
  const cappedU = Math.min(98, (BASE_WEIGHTS.U || 5) + uShift);

  // Rebuild weights with U shift
  const weights: Record<string, number> = { ...BASE_WEIGHTS };
  const oldU = weights.U;
  weights.U = cappedU;

  // Distribute the difference proportionally among non-U classes
  const nonUTotal = Object.entries(weights).reduce((s, [k, v]) => k !== 'U' ? s + v : s, 0);
  const reduction = cappedU - oldU;
  if (reduction > 0 && nonUTotal > 0) {
    for (const k of Object.keys(weights)) {
      if (k !== 'U') {
        weights[k] = Math.max(0, weights[k] - (weights[k] / nonUTotal) * reduction);
      }
    }
  }

  // Weighted random selection
  const entries = Object.entries(weights);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let roll = Math.random() * total;
  for (const [cls, w] of entries) {
    roll -= w;
    if (roll <= 0) return cls;
  }
  return 'M'; // fallback
}

function computeProduction(planetClass: string, colonists: number): { fuel: number; organics: number; equipment: number; fighters: number } {
  const config = PLANET_CLASSES[planetClass];
  if (!config || config.fighterDivisor === 0) {
    return { fuel: 0, organics: 0, equipment: 0, fighters: 0 };
  }

  // Bell curve: max production at 50% of max colonists
  const optimalPop = config.maxColonists * 0.5;
  const ratio = colonists / optimalPop;
  // Bell curve approximation: production = max * (ratio) * (2 - ratio) capped at 1.0
  const efficiency = Math.min(1, ratio * (2 - ratio));

  const fuel = Math.floor(config.maxDailyFuel * efficiency);
  const organics = Math.floor(config.maxDailyOrg * efficiency);
  const equipment = Math.floor(config.maxDailyEq * efficiency);
  const fighters = config.fighterDivisor > 0 ? Math.floor(colonists / config.fighterDivisor) : 0;

  return { fuel, organics, equipment, fighters };
}

// ─── Route handlers ─────────────────────────────────────────────────

/**
 * POST /api/planets/create
 * Launch a Genesis Torpedo to create a planet in the current sector.
 */
export async function handleCreatePlanet(auth: AuthContext, request: Request, db: D1Database): Promise<Response> {
  let body: { galaxyId?: number; sectorId?: number };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const { galaxyId, sectorId } = body;
  if (!galaxyId || !sectorId) return jsonError('galaxyId and sectorId required');

  // Get player's ship
  const ship = await db
    .prepare('SELECT * FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
    .bind(auth.playerId, galaxyId)
    .first<{ id: number; credits: number; current_sector: number }>();

  if (!ship) return jsonError('No ship in this galaxy', 404);
  if (ship.current_sector !== sectorId) return jsonError('Must be in target sector', 403);
  if (ship.credits < GENESIS_TORPEDO_COST) return jsonError(`Genesis Torpedo costs ${GENESIS_TORPEDO_COST.toLocaleString()} cr`, 402);

  // Check sector is not safe space
  const sector = await db
    .prepare('SELECT danger, planet_count FROM sectors WHERE galaxy_id = ? AND sector_index = ?')
    .bind(galaxyId, sectorId)
    .first<{ danger: string; planet_count: number }>();

  if (!sector) return jsonError('Sector not found', 404);
  if (sector.danger === 'safe') return jsonError('Cannot create planets in CHOAM Protected Space', 403);

  // Check planet limit
  const existing = await db
    .prepare('SELECT COUNT(*) as cnt FROM planets WHERE galaxy_id = ? AND sector_index = ?')
    .bind(galaxyId, sectorId)
    .first<{ cnt: number }>();

  if (existing && existing.cnt >= MAX_PLANETS_PER_SECTOR) {
    return jsonError(`Sector already has ${MAX_PLANETS_PER_SECTOR} planets (maximum)`, 403);
  }

  // Roll planet class
  const planetClass = rollPlanetClass(sector.planet_count || 0);
  const config = PLANET_CLASSES[planetClass];

  // Deduct credits
  await db
    .prepare('UPDATE player_ships SET credits = credits - ? WHERE id = ?')
    .bind(GENESIS_TORPEDO_COST, ship.id)
    .run();

  // Create planet
  const result = await db
    .prepare(
      `INSERT INTO planets (galaxy_id, sector_index, owner_id, name, class, colonists, fuel, organics, equipment, fighters, citadel_level)
       VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0)`
    )
    .bind(galaxyId, sectorId, auth.playerId, `${config.name} Colony`, planetClass)
    .run();

  const planetId = result.meta?.last_row_id;

  // Update planet_count on sector
  await db
    .prepare('UPDATE sectors SET planet_count = planet_count + 1 WHERE galaxy_id = ? AND sector_index = ?')
    .bind(galaxyId, sectorId)
    .run();

  return json({
    success: true,
    planetId,
    class: planetClass,
    className: config.name,
    description: config.description,
    maxColonists: config.maxColonists,
    sectorId,
    remainingCredits: ship.credits - GENESIS_TORPEDO_COST,
  });
}

/**
 * GET /api/planets/sector?galaxyId=&sectorId=
 * List planets in a sector.
 */
export async function handleGetSectorPlanets(auth: AuthContext, galaxyId: string | null, sectorId: string | null, db: D1Database): Promise<Response> {
  if (!galaxyId || !sectorId) return jsonError('galaxyId and sectorId required');

  const results = await db
    .prepare(
      `SELECT p.id, p.class, p.colonists, p.citadel_level, p.name, p.owner_id,
              pl.display_name as owner_name
       FROM planets p
       LEFT JOIN players pl ON p.owner_id = pl.id
       WHERE p.galaxy_id = ? AND p.sector_index = ?`
    )
    .bind(Number(galaxyId), Number(sectorId))
    .all<{ id: number; class: string; colonists: number; citadel_level: number; name: string; owner_id: number; owner_name: string | null }>();

  const planets = (results.results ?? []).map(p => ({
    id: p.id,
    class: p.class,
    className: PLANET_CLASSES[p.class]?.name ?? p.class,
    name: p.name,
    colonists: p.colonists,
    citadelLevel: p.citadel_level,
    ownerId: p.owner_id,
    ownerName: p.owner_name ?? 'Unknown',
    isOwn: p.owner_id === auth.playerId,
  }));

  return json({ planets });
}

/**
 * GET /api/planets/:id
 * Get full planet details.
 */
export async function handleGetPlanet(auth: AuthContext, planetId: string, db: D1Database): Promise<Response> {
  const planet = await db
    .prepare('SELECT * FROM planets WHERE id = ?')
    .bind(Number(planetId))
    .first<{
      id: number; galaxy_id: number; sector_index: number; owner_id: number;
      name: string; class: string; colonists: number;
      fuel: number; organics: number; equipment: number; fighters: number;
      citadel_level: number; sect_cannon_pct: number; atmo_cannon_pct: number;
    }>();

  if (!planet) return jsonError('Planet not found', 404);

  const config = PLANET_CLASSES[planet.class];
  const production = computeProduction(planet.class, planet.colonists);

  return json({
    id: planet.id,
    galaxyId: planet.galaxy_id,
    sectorIndex: planet.sector_index,
    ownerId: planet.owner_id,
    isOwn: planet.owner_id === auth.playerId,
    name: planet.name,
    class: planet.class,
    className: config?.name ?? planet.class,
    description: config?.description ?? '',
    colonists: planet.colonists,
    maxColonists: config?.maxColonists ?? 0,
    fuel: planet.fuel,
    organics: planet.organics,
    equipment: planet.equipment,
    fighters: planet.fighters,
    citadelLevel: planet.citadel_level,
    sectCannonPct: planet.sect_cannon_pct,
    atmoCannonPct: planet.atmo_cannon_pct,
    dailyProduction: production,
    productionCaps: config?.productionCaps ?? { fuel: 0, org: 0, eq: 0 },
  });
}

/**
 * POST /api/planets/colonize
 * Transport colonists to a planet.
 */
export async function handleColonize(auth: AuthContext, request: Request, db: D1Database): Promise<Response> {
  let body: { galaxyId?: number; planetId?: number; quantity?: number };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const { galaxyId, planetId, quantity } = body;
  if (!galaxyId || !planetId || !quantity) return jsonError('galaxyId, planetId, and quantity required');
  if (quantity <= 0) return jsonError('Quantity must be positive');

  // Get planet
  const planet = await db
    .prepare('SELECT * FROM planets WHERE id = ? AND galaxy_id = ?')
    .bind(planetId, galaxyId)
    .first<{
      id: number; owner_id: number; class: string; colonists: number; sector_index: number;
    }>();

  if (!planet) return jsonError('Planet not found', 404);
  if (planet.owner_id !== auth.playerId) return jsonError('Not your planet', 403);

  const config = PLANET_CLASSES[planet.class];
  if (!config) return jsonError('Unknown planet class', 500);

  // Check capacity
  const spaceRemaining = config.maxColonists - planet.colonists;
  if (spaceRemaining <= 0) return jsonError('Planet at maximum colonist capacity', 403);
  const actualQuantity = Math.min(quantity, spaceRemaining);

  // Get ship for fuel/credits check
  const ship = await db
    .prepare('SELECT * FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
    .bind(auth.playerId, galaxyId)
    .first<{
      id: number; credits: number; current_sector: number; cargo_json: string;
    }>();

  if (!ship) return jsonError('No ship in this galaxy', 404);

  // Calculate transport cost
  const distance = Math.abs(ship.current_sector - planet.sector_index);
  const fuelCost = distance * COLONIST_FUEL_COST_PER_SECTOR * Math.ceil(actualQuantity / 100);
  const creditCost = actualQuantity * COLONIST_TRANSPORT_COST_PER_UNIT;

  // Check cargo for fuel
  const cargo = JSON.parse(ship.cargo_json || '{}') as Record<string, number>;
  if ((cargo.fuel || 0) < fuelCost) {
    return jsonError(`Need ${fuelCost} fuel for transport (have ${cargo.fuel || 0})`, 402);
  }
  if (ship.credits < creditCost) {
    return jsonError(`Need ${creditCost.toLocaleString()} cr for transport`, 402);
  }

  // Deduct fuel from cargo
  cargo.fuel = (cargo.fuel || 0) - fuelCost;

  // Update everything
  await db.batch([
    db.prepare('UPDATE planets SET colonists = colonists + ?, updated_at = datetime("now") WHERE id = ?')
      .bind(actualQuantity, planet.id),
    db.prepare('UPDATE player_ships SET credits = credits - ?, cargo_json = ? WHERE id = ?')
      .bind(creditCost, JSON.stringify(cargo), ship.id),
  ]);

  return json({
    success: true,
    planetId: planet.id,
    colonistsAdded: actualQuantity,
    totalColonists: planet.colonists + actualQuantity,
    maxColonists: config.maxColonists,
    fuelConsumed: fuelCost,
    creditsConsumed: creditCost,
  });
}

/**
 * POST /api/planets/production-tick
 * Admin/internal: run daily production for all planets in a galaxy.
 */
export async function handleProductionTick(db: D1Database, galaxyId: number): Promise<{ planetsProcessed: number; totalFuel: number; totalOrg: number; totalEq: number; totalFighters: number }> {
  const planets = await db
    .prepare('SELECT * FROM planets WHERE galaxy_id = ?')
    .bind(galaxyId)
    .all<{
      id: number; class: string; colonists: number; fuel: number; organics: number; equipment: number; fighters: number;
      owner_id: number;
    }>();

  let planetsProcessed = 0;
  let totalFuel = 0;
  let totalOrg = 0;
  let totalEq = 0;
  let totalFighters = 0;

  for (const planet of (planets.results ?? [])) {
    if (planet.colonists <= 0) continue;

    const config = PLANET_CLASSES[planet.class];
    if (!config || config.fighterDivisor === 0) continue;

    const prod = computeProduction(planet.class, planet.colonists);

    // Cap at production limits
    const newFuel = Math.min(config.productionCaps.fuel, planet.fuel + prod.fuel);
    const newOrg = Math.min(config.productionCaps.org, planet.organics + prod.organics);
    const newEq = Math.min(config.productionCaps.eq, planet.equipment + prod.equipment);
    const newFighters = planet.fighters + prod.fighters;

    await db
      .prepare('UPDATE planets SET fuel = ?, organics = ?, equipment = ?, fighters = ?, updated_at = datetime("now") WHERE id = ?')
      .bind(newFuel, newOrg, newEq, newFighters, planet.id)
      .run();

    // Add produced fighters to owner's ship if they have one
    if (prod.fighters > 0) {
      await db
        .prepare('UPDATE player_ships SET fighters = fighters + ? WHERE player_id = ? AND galaxy_id = ?')
        .bind(prod.fighters, planet.owner_id, galaxyId)
        .run();
    }

    totalFuel += prod.fuel;
    totalOrg += prod.organics;
    totalEq += prod.equipment;
    totalFighters += prod.fighters;
    planetsProcessed++;
  }

  return { planetsProcessed, totalFuel, totalOrg, totalEq, totalFighters };
}

// Export class config for use by other routes
export { PLANET_CLASSES, GENESIS_TORPEDO_COST, MAX_PLANETS_PER_SECTOR, computeProduction };
