/**
 * Planet routes — creation, colonization, production, citadel advancement
 * TW-14: Planets & Citadels
 */
import type { D1Database } from '@cloudflare/workers-types';
import { json, jsonError, actionBudgetExceededResponse } from '../utils/cors.js';
import { checkAndDeductActionPoints } from '../utils/actionBudget.js';
import { verifyToken, type AuthContext } from '../utils/auth.js';
import { applyAlignmentAndExperience } from '../utils/alignment.js';
import { resolveDefeat } from './combat.js';

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

  const budget = await checkAndDeductActionPoints(db, auth.playerId, galaxyId, 'planet-create');
  if (!budget.allowed) return actionBudgetExceededResponse(budget);

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

  const alignmentGain = Math.floor(GENESIS_TORPEDO_COST / 2000);
  await applyAlignmentAndExperience(db, auth.playerId, galaxyId, {
    alignmentDelta: alignmentGain,
    experienceDelta: 100,
  });

  return json({
    success: true,
    planetId,
    class: planetClass,
    className: config.name,
    description: config.description,
    maxColonists: config.maxColonists,
    sectorId,
    remainingCredits: ship.credits - GENESIS_TORPEDO_COST,
    alignmentGained: alignmentGain,
    experienceGained: 100,
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

  const budget = await checkAndDeductActionPoints(db, auth.playerId, galaxyId, 'planet-colonize');
  if (!budget.allowed) return actionBudgetExceededResponse(budget);

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

// ─── Citadel advancement costs per class per level ────────────────────
// Source: lore-reference/core/planets.md — Citadel Advancement Requirements
// Each entry: { colonists, fuel, organics, equipment, days }
// "days" is real-world days of construction time (we map to ticks)

interface CitadelLevelCost {
  colonists: number; // minimum colonists required
  fuel: number;
  organics: number;
  equipment: number;
  ticks: number; // construction ticks (1 tick per cron run)
}

const CITADEL_COSTS: Record<string, CitadelLevelCost[]> = {
  M: [
    { colonists: 1_000, fuel: 300, organics: 200, equipment: 250, ticks: 4 },
    { colonists: 2_000, fuel: 200, organics: 50,  equipment: 250, ticks: 4 },
    { colonists: 4_000, fuel: 500, organics: 250, equipment: 500, ticks: 5 },
    { colonists: 6_000, fuel: 1_000, organics: 1_200, equipment: 1_000, ticks: 10 },
    { colonists: 6_000, fuel: 300, organics: 400, equipment: 1_000, ticks: 5 },
    { colonists: 6_000, fuel: 1_000, organics: 1_200, equipment: 2_000, ticks: 15 },
  ],
  K: [
    { colonists: 1_000, fuel: 400, organics: 300, equipment: 600, ticks: 6 },
    { colonists: 2_400, fuel: 300, organics: 80,  equipment: 400, ticks: 5 },
    { colonists: 4_400, fuel: 600, organics: 400, equipment: 650, ticks: 8 },
    { colonists: 7_000, fuel: 700, organics: 900, equipment: 800, ticks: 5 },
    { colonists: 8_000, fuel: 800, organics: 400, equipment: 1_000, ticks: 4 },
    { colonists: 7_000, fuel: 700, organics: 900, equipment: 1_600, ticks: 8 },
  ],
  O: [
    { colonists: 1_400, fuel: 500, organics: 200, equipment: 400, ticks: 6 },
    { colonists: 2_400, fuel: 200, organics: 50,  equipment: 300, ticks: 5 },
    { colonists: 4_400, fuel: 600, organics: 400, equipment: 650, ticks: 8 },
    { colonists: 7_000, fuel: 700, organics: 900, equipment: 800, ticks: 5 },
    { colonists: 8_000, fuel: 300, organics: 400, equipment: 1_000, ticks: 4 },
    { colonists: 7_000, fuel: 700, organics: 900, equipment: 1_600, ticks: 8 },
  ],
  L: [
    { colonists: 400,   fuel: 150, organics: 100, equipment: 150, ticks: 2 },
    { colonists: 1_400, fuel: 200, organics: 50,  equipment: 250, ticks: 5 },
    { colonists: 3_600, fuel: 600, organics: 250, equipment: 700, ticks: 5 },
    { colonists: 5_600, fuel: 1_000, organics: 1_200, equipment: 1_000, ticks: 8 },
    { colonists: 7_000, fuel: 300, organics: 400, equipment: 1_000, ticks: 5 },
    { colonists: 5_600, fuel: 1_000, organics: 1_200, equipment: 2_000, ticks: 12 },
  ],
  C: [
    { colonists: 1_000, fuel: 400, organics: 300, equipment: 600, ticks: 5 },
    { colonists: 2_400, fuel: 300, organics: 80,  equipment: 400, ticks: 5 },
    { colonists: 4_400, fuel: 600, organics: 400, equipment: 650, ticks: 7 },
    { colonists: 6_600, fuel: 700, organics: 900, equipment: 700, ticks: 5 },
    { colonists: 9_000, fuel: 300, organics: 400, equipment: 1_000, ticks: 4 },
    { colonists: 6_600, fuel: 700, organics: 900, equipment: 1_400, ticks: 8 },
  ],
  H: [
    { colonists: 800,   fuel: 500, organics: 300, equipment: 600, ticks: 4 },
    { colonists: 1_600, fuel: 300, organics: 100, equipment: 400, ticks: 5 },
    { colonists: 4_400, fuel: 1_200, organics: 400, equipment: 1_500, ticks: 8 },
    { colonists: 7_000, fuel: 2_000, organics: 2_000, equipment: 2_500, ticks: 12 },
    { colonists: 10_000, fuel: 3_000, organics: 1_200, equipment: 2_000, ticks: 5 },
    { colonists: 7_000, fuel: 2_000, organics: 2_000, equipment: 5_000, ticks: 18 },
  ],
  U: [
    { colonists: 3_000, fuel: 1_200, organics: 400, equipment: 2_500, ticks: 8 },
    { colonists: 3_000, fuel: 300,   organics: 100, equipment: 400,   ticks: 4 },
    { colonists: 8_000, fuel: 500,   organics: 500, equipment: 2_000, ticks: 5 },
    { colonists: 6_000, fuel: 500,   organics: 200, equipment: 600,   ticks: 5 },
    { colonists: 8_000, fuel: 200,   organics: 200, equipment: 600,   ticks: 4 },
    { colonists: 6_000, fuel: 500,   organics: 200, equipment: 1_200, ticks: 8 },
  ],
};

// Citadel level descriptions
const CITADEL_LEVELS = [
  { level: 0, name: 'None', description: 'No defenses. Planet is exposed.' },
  { level: 1, name: 'Bunker', description: 'Basic shelter. Fighters can be deployed from planet.' },
  { level: 2, name: 'Barracks', description: 'Colonist quarters expanded. Improved fighter garrison.' },
  { level: 3, name: 'Fortress', description: 'Sector cannon installed. Planet fires on hostiles entering sector.' },
  { level: 4, name: 'Citadel', description: 'Production boost. Planetary trading unlocked. Atmospheric cannon.' },
  { level: 5, name: 'Stronghold', description: 'Reinforced defenses. Enhanced cannon range and damage.' },
  { level: 6, name: 'Interdictor', description: 'Maximum fortification. Q-cannon at full power. Interdiction field.' },
];

/**
 * GET /api/planets/citadel-costs?planetId=
 * Get the cost to advance a planet's citadel to the next level.
 */
export async function handleGetCitadelCosts(auth: AuthContext, planetId: string, db: D1Database): Promise<Response> {
  const planet = await db
    .prepare('SELECT id, class, citadel_level, colonists, fuel, organics, equipment, owner_id FROM planets WHERE id = ?')
    .bind(Number(planetId))
    .first<{ id: number; class: string; citadel_level: number; colonists: number; fuel: number; organics: number; equipment: number; owner_id: number }>();

  if (!planet) return jsonError('Planet not found', 404);

  const currentLevel = planet.citadel_level;
  if (currentLevel >= 6) {
    return json({ currentLevel, nextLevel: null, maxLevel: true, message: 'Citadel at maximum level' });
  }

  const costs = CITADEL_COSTS[planet.class];
  if (!costs) return jsonError('Unknown planet class', 500);

  const nextCost = costs[currentLevel]; // index 0 = upgrade from 0→1
  const currentInfo = CITADEL_LEVELS[currentLevel];
  const nextInfo = CITADEL_LEVELS[currentLevel + 1];

  const canAfford = planet.fuel >= nextCost.fuel
    && planet.organics >= nextCost.organics
    && planet.equipment >= nextCost.equipment
    && planet.colonists >= nextCost.colonists;

  return json({
    planetId: planet.id,
    currentLevel,
    currentName: currentInfo.name,
    nextLevel: currentLevel + 1,
    nextName: nextInfo.name,
    nextDescription: nextInfo.description,
    requirements: {
      colonists: nextCost.colonists,
      fuel: nextCost.fuel,
      organics: nextCost.organics,
      equipment: nextCost.equipment,
      constructionTicks: nextCost.ticks,
    },
    currentResources: {
      colonists: planet.colonists,
      fuel: planet.fuel,
      organics: planet.organics,
      equipment: planet.equipment,
    },
    canAfford,
    isOwn: planet.owner_id === auth.playerId,
  });
}

/**
 * POST /api/planets/citadel/advance
 * Advance a planet's citadel to the next level. Deducts resources from planet.
 */
export async function handleAdvanceCitadel(auth: AuthContext, request: Request, db: D1Database): Promise<Response> {
  let body: { planetId?: number };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const { planetId } = body;
  if (!planetId) return jsonError('planetId required');

  const planet = await db
    .prepare('SELECT * FROM planets WHERE id = ?')
    .bind(planetId)
    .first<{
      id: number; galaxy_id: number; owner_id: number; class: string; citadel_level: number;
      colonists: number; fuel: number; organics: number; equipment: number;
    }>();

  if (!planet) return jsonError('Planet not found', 404);
  if (planet.owner_id !== auth.playerId) return jsonError('Not your planet', 403);

  const budget = await checkAndDeductActionPoints(db, auth.playerId, planet.galaxy_id, 'citadel-advance');
  if (!budget.allowed) return actionBudgetExceededResponse(budget);

  if (planet.citadel_level >= 6) return jsonError('Citadel already at maximum level', 403);

  const costs = CITADEL_COSTS[planet.class];
  if (!costs) return jsonError('Unknown planet class', 500);

  const nextCost = costs[planet.citadel_level];

  // Check colonist minimum
  if (planet.colonists < nextCost.colonists) {
    return jsonError(`Need ${nextCost.colonists.toLocaleString()} colonists (have ${planet.colonists.toLocaleString()})`, 403);
  }

  // Check resources
  if (planet.fuel < nextCost.fuel) return jsonError(`Need ${nextCost.fuel.toLocaleString()} fuel (have ${planet.fuel.toLocaleString()})`, 403);
  if (planet.organics < nextCost.organics) return jsonError(`Need ${nextCost.organics.toLocaleString()} organics (have ${planet.organics.toLocaleString()})`, 403);
  if (planet.equipment < nextCost.equipment) return jsonError(`Need ${nextCost.equipment.toLocaleString()} equipment (have ${planet.equipment.toLocaleString()})`, 403);

  // Deduct resources and advance
  const newLevel = planet.citadel_level + 1;
  await db
    .prepare('UPDATE planets SET citadel_level = ?, fuel = fuel - ?, organics = organics - ?, equipment = equipment - ?, updated_at = datetime("now") WHERE id = ?')
    .bind(newLevel, nextCost.fuel, nextCost.organics, nextCost.equipment, planet.id)
    .run();

  const levelInfo = CITADEL_LEVELS[newLevel];

  await applyAlignmentAndExperience(db, auth.playerId, planet.galaxy_id, {
    alignmentDelta: Math.max(1, Math.floor((nextCost.fuel + nextCost.organics + nextCost.equipment) / 2000)),
    experienceDelta: 50,
  });

  return json({
    success: true,
    planetId: planet.id,
    newLevel,
    levelName: levelInfo.name,
    description: levelInfo.description,
    resourcesConsumed: {
      fuel: nextCost.fuel,
      organics: nextCost.organics,
      equipment: nextCost.equipment,
    },
    remainingResources: {
      fuel: planet.fuel - nextCost.fuel,
      organics: planet.organics - nextCost.organics,
      equipment: planet.equipment - nextCost.equipment,
    },
    experienceGained: 50,
  });
}

/**
 * POST /api/planets/qcannon
 * Configure Q-cannon settings (requires citadel level 3+ for sector, 4+ for atmospheric).
 */
export async function handleConfigureQCannon(auth: AuthContext, request: Request, db: D1Database): Promise<Response> {
  let body: { planetId?: number; sectPct?: number; atmoPct?: number };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const { planetId, sectPct, atmoPct } = body;
  if (!planetId) return jsonError('planetId required');

  const planet = await db
    .prepare('SELECT id, owner_id, citadel_level FROM planets WHERE id = ?')
    .bind(planetId)
    .first<{ id: number; owner_id: number; galaxy_id: number; citadel_level: number }>();

  if (!planet) return jsonError('Planet not found', 404);
  if (planet.owner_id !== auth.playerId) return jsonError('Not your planet', 403);

  const budget = await checkAndDeductActionPoints(db, auth.playerId, planet.galaxy_id, 'qcannon');
  if (!budget.allowed) return actionBudgetExceededResponse(budget);

  const updates: string[] = [];
  const values: number[] = [];

  if (sectPct !== undefined) {
    if (planet.citadel_level < 3) return jsonError('Sector cannon requires Citadel level 3', 403);
    const pct = Math.max(0, Math.min(100, Math.floor(sectPct)));
    updates.push('sect_cannon_pct = ?');
    values.push(pct);
  }

  if (atmoPct !== undefined) {
    if (planet.citadel_level < 4) return jsonError('Atmospheric cannon requires Citadel level 4', 403);
    const pct = Math.max(0, Math.min(100, Math.floor(atmoPct)));
    updates.push('atmo_cannon_pct = ?');
    values.push(pct);
  }

  if (updates.length === 0) return jsonError('No settings provided');

  values.push(planet.id);
  await db
    .prepare(`UPDATE planets SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`)
    .bind(...values)
    .run();

  return json({
    success: true,
    planetId: planet.id,
    sectCannonPct: sectPct !== undefined ? Math.max(0, Math.min(100, sectPct)) : undefined,
    atmoCannonPct: atmoPct !== undefined ? Math.max(0, Math.min(100, atmoPct)) : undefined,
  });
}

/**
 * POST /api/planets/transport
 * Move resources between ship cargo and planet storage.
 */
export async function handlePlanetTransport(auth: AuthContext, request: Request, db: D1Database): Promise<Response> {
  let body: { planetId?: number; direction?: 'deposit' | 'withdraw'; fuel?: number; organics?: number; equipment?: number };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const { planetId, direction, fuel, organics, equipment } = body;
  if (!planetId || !direction) return jsonError('planetId and direction (deposit/withdraw) required');
  if (direction !== 'deposit' && direction !== 'withdraw') return jsonError('direction must be deposit or withdraw');

  const totalQty = (fuel || 0) + (organics || 0) + (equipment || 0);
  if (totalQty <= 0) return jsonError('Must specify at least one resource > 0');

  const planet = await db
    .prepare('SELECT * FROM planets WHERE id = ?')
    .bind(planetId)
    .first<{
      id: number; owner_id: number; galaxy_id: number; fuel: number; organics: number; equipment: number;
    }>();

  if (!planet) return jsonError('Planet not found', 404);
  if (planet.owner_id !== auth.playerId) return jsonError('Not your planet', 403);

  const budget = await checkAndDeductActionPoints(db, auth.playerId, planet.galaxy_id, 'planet-transport');
  if (!budget.allowed) return actionBudgetExceededResponse(budget);

  // Get player's ship cargo
  const ship = await db
    .prepare('SELECT id, cargo_json FROM player_ships WHERE player_id = ?')
    .bind(auth.playerId)
    .first<{ id: number; cargo_json: string }>();

  if (!ship) return jsonError('No ship found', 404);

  const cargo = JSON.parse(ship.cargo_json || '{}') as Record<string, number>;

  const dFuel = fuel || 0;
  const dOrg = organics || 0;
  const dEq = equipment || 0;

  if (direction === 'deposit') {
    // Check ship has enough
    if ((cargo.fuel || 0) < dFuel) return jsonError(`Not enough fuel in cargo (have ${cargo.fuel || 0})`);
    if ((cargo.organics || 0) < dOrg) return jsonError(`Not enough organics in cargo (have ${cargo.organics || 0})`);
    if ((cargo.equipment || 0) < dEq) return jsonError(`Not enough equipment in cargo (have ${cargo.equipment || 0})`);

    cargo.fuel = (cargo.fuel || 0) - dFuel;
    cargo.organics = (cargo.organics || 0) - dOrg;
    cargo.equipment = (cargo.equipment || 0) - dEq;

    await db.batch([
      db.prepare('UPDATE planets SET fuel = fuel + ?, organics = organics + ?, equipment = equipment + ?, updated_at = datetime("now") WHERE id = ?')
        .bind(dFuel, dOrg, dEq, planet.id),
      db.prepare('UPDATE player_ships SET cargo_json = ? WHERE id = ?')
        .bind(JSON.stringify(cargo), ship.id),
    ]);
  } else {
    // Check planet has enough
    if (planet.fuel < dFuel) return jsonError(`Planet only has ${planet.fuel} fuel`);
    if (planet.organics < dOrg) return jsonError(`Planet only has ${planet.organics} organics`);
    if (planet.equipment < dEq) return jsonError(`Planet only has ${planet.equipment} equipment`);

    cargo.fuel = (cargo.fuel || 0) + dFuel;
    cargo.organics = (cargo.organics || 0) + dOrg;
    cargo.equipment = (cargo.equipment || 0) + dEq;

    await db.batch([
      db.prepare('UPDATE planets SET fuel = fuel - ?, organics = organics - ?, equipment = equipment - ?, updated_at = datetime("now") WHERE id = ?')
        .bind(dFuel, dOrg, dEq, planet.id),
      db.prepare('UPDATE player_ships SET cargo_json = ? WHERE id = ?')
        .bind(JSON.stringify(cargo), ship.id),
    ]);
  }

  return json({
    success: true,
    direction,
    moved: { fuel: dFuel, organics: dOrg, equipment: dEq },
  });
}

/**
 * Compute Q-cannon damage for a planet.
 * Sector cannon: (TotalOre * SectPct) / 3
 * Atmospheric cannon: TotalOre * AtmoPct * 2
 */
export function computeQCannonDamage(planet: { fuel: number; organics: number; equipment: number; sect_cannon_pct: number; atmo_cannon_pct: number; citadel_level: number }): { sectDamage: number; atmoDamage: number } {
  const totalOre = planet.fuel + planet.organics + planet.equipment;

  let sectDamage = 0;
  if (planet.citadel_level >= 3 && planet.sect_cannon_pct > 0) {
    sectDamage = Math.floor((totalOre * planet.sect_cannon_pct) / 300);
  }

  let atmoDamage = 0;
  if (planet.citadel_level >= 4 && planet.atmo_cannon_pct > 0) {
    atmoDamage = Math.floor(totalOre * planet.atmo_cannon_pct * 2 / 100);
  }

  return { sectDamage, atmoDamage };
}

/**
 * Apply sector Q-cannon fire from hostile planets when a player attempts entry.
 */
export async function applyQCannonEntryEffects(
  db: D1Database,
  playerId: number,
  galaxyId: number,
  targetSectorId: number,
): Promise<{
  operation: { step: 'q_cannon'; status: 'resolved' | 'skipped_no_hostiles' | 'no_op'; details?: Record<string, unknown> };
  destroyed: boolean;
  ship: Record<string, unknown> | null;
}> {
  const ship = await db
    .prepare('SELECT * FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
    .bind(playerId, galaxyId)
    .first<any>();

  if (!ship) {
    return {
      operation: { step: 'q_cannon', status: 'no_op', details: { reason: 'ship_not_found' } },
      destroyed: false,
      ship: null,
    };
  }

  const hostilePlanets = await db
    .prepare(
      `SELECT id, owner_id, fuel, organics, equipment, citadel_level, sect_cannon_pct, atmo_cannon_pct
       FROM planets
       WHERE galaxy_id = ? AND sector_index = ? AND owner_id != ? AND citadel_level >= 3 AND sect_cannon_pct > 0`
    )
    .bind(galaxyId, targetSectorId, playerId)
    .all<{
      id: number;
      owner_id: number;
      fuel: number;
      organics: number;
      equipment: number;
      citadel_level: number;
      sect_cannon_pct: number;
      atmo_cannon_pct: number;
    }>();

  const planets = hostilePlanets.results ?? [];
  if (planets.length === 0) {
    return {
      operation: { step: 'q_cannon', status: 'skipped_no_hostiles' },
      destroyed: false,
      ship,
    };
  }

  const damageBreakdown = planets.map((p) => ({
    planetId: p.id,
    ownerId: p.owner_id,
    ...computeQCannonDamage(p),
  }));

  const totalDamage = damageBreakdown.reduce((sum, d) => sum + d.sectDamage, 0);
  if (totalDamage <= 0) {
    return {
      operation: {
        step: 'q_cannon',
        status: 'skipped_no_hostiles',
        details: { hostilePlanets: planets.length, reason: 'zero_damage' },
      },
      destroyed: false,
      ship,
    };
  }

  const shieldAbsorb = Math.min(ship.shield ?? 0, totalDamage);
  const hullDamage = Math.max(0, totalDamage - shieldAbsorb);
  const nextShield = Math.max(0, (ship.shield ?? 0) - shieldAbsorb);
  const nextHull = Math.max(0, (ship.hull ?? 0) - hullDamage);

  await db
    .prepare('UPDATE player_ships SET shield = ?, hull = ?, updated_at = datetime("now") WHERE player_id = ? AND galaxy_id = ?')
    .bind(nextShield, nextHull, playerId, galaxyId)
    .run();

  if (nextHull <= 0) {
    await resolveDefeat(db, galaxyId, playerId, targetSectorId, null, 'fighter');
    const respawned = await db
      .prepare('SELECT * FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
      .bind(playerId, galaxyId)
      .first();

    return {
      operation: {
        step: 'q_cannon',
        status: 'resolved',
        details: {
          hostilePlanets: planets.length,
          totalDamage,
          shieldAbsorb,
          hullDamage,
          destroyed: true,
          damageBreakdown,
        },
      },
      destroyed: true,
      ship: respawned,
    };
  }

  const updated = await db
    .prepare('SELECT * FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
    .bind(playerId, galaxyId)
    .first();

  return {
    operation: {
      step: 'q_cannon',
      status: 'resolved',
      details: {
        hostilePlanets: planets.length,
        totalDamage,
        shieldAbsorb,
        hullDamage,
        hullRemaining: nextHull,
        shieldRemaining: nextShield,
        damageBreakdown,
      },
    },
    destroyed: false,
    ship: updated,
  };
}

// Export class config for use by other routes
export { PLANET_CLASSES, GENESIS_TORPEDO_COST, MAX_PLANETS_PER_SECTOR, computeProduction, CITADEL_COSTS, CITADEL_LEVELS };
