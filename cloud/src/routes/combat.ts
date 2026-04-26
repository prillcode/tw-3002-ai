import type { D1Database } from '@cloudflare/workers-types';
import type { AuthContext } from '../utils/auth.js';
import { json, jsonError } from '../utils/cors.js';

// ─── Constants ───────────────────────────────────────────

const LOOT_CREDITS_PCT = 0.25; // 25% for first pass (raise to 0.50 after TW-06)
const LOOT_CARGO_PCT = 0.10;
const NEW_PLAYER_CREDITS_MAX = 10_000;
const NEW_PLAYER_HOURS_MAX = 24;
const WANTED_KILL_THRESHOLD = 3;
const WANTED_WINDOW_HOURS = 24;
const WANTED_DECAY_HOURS = 48;
const INSURANCE_COST_PCT = 0.05; // 5% of net worth
const INSURANCE_DURATION_DAYS = 7;
const INSURANCE_DEATH_PENALTY_PCT = 0.05; // 5% lost instead of 25%

// ─── Core: Resolve Defeat ────────────────────────────────

export interface DefeatResult {
  respawned: boolean;
  fedSpaceSector: number;
  lootCredits: number;
  lootCargo: Record<string, number>;
  attackerLooted: boolean;
  protected: boolean;
  insuranceApplied: boolean;
}

/**
 * Central defeat pipeline. Called by any system that defeats a player:
 * - NPC combat (action.ts)
 * - Future: fighter encounters (TW-06)
 * - Future: PvP combat (TW-06+)
 */
export async function resolveDefeat(
  db: D1Database,
  galaxyId: number,
  victimId: number,
  sectorId: number,
  attackerId: number | null,
  cause: 'npc' | 'fighter' | 'pvp',
): Promise<DefeatResult> {
  // Load victim
  const victim = await db
    .prepare('SELECT * FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
    .bind(victimId, galaxyId)
    .first<{
      credits: number;
      cargo_json: string;
      hull: number;
      max_turns: number;
      net_worth: number;
      deaths: number;
      insurance_expires: string | null;
      created_at: string;
    }>();

  if (!victim) {
    return { respawned: false, fedSpaceSector: 0, lootCredits: 0, lootCargo: {}, attackerLooted: false, protected: false, insuranceApplied: false };
  }

  // Check FedSpace protection
  const sector = await db
    .prepare('SELECT danger FROM sectors WHERE galaxy_id = ? AND sector_index = ?')
    .bind(galaxyId, sectorId)
    .first<{ danger: string }>();

  if (sector?.danger === 'safe') {
    return { respawned: false, fedSpaceSector: sectorId, lootCredits: 0, lootCargo: {}, attackerLooted: false, protected: true, insuranceApplied: false };
  }

  // Check new player protection
  const player = await db
    .prepare('SELECT created_at FROM players WHERE id = ?')
    .bind(victimId)
    .first<{ created_at: string }>();

  const accountAgeHours = (Date.now() - new Date(player?.created_at ?? 0).getTime()) / (1000 * 60 * 60);
  const isNewPlayer = victim.net_worth < NEW_PLAYER_CREDITS_MAX || accountAgeHours < NEW_PLAYER_HOURS_MAX;

  if (isNewPlayer) {
    return { respawned: false, fedSpaceSector: sectorId, lootCredits: 0, lootCargo: {}, attackerLooted: false, protected: true, insuranceApplied: false };
  }

  // Check insurance
  const now = new Date();
  const insuranceActive = victim.insurance_expires ? new Date(victim.insurance_expires) > now : false;
  const deathPenaltyPct = insuranceActive ? INSURANCE_DEATH_PENALTY_PCT : LOOT_CREDITS_PCT;

  // Calculate loot
  const lootCredits = Math.floor(victim.credits * deathPenaltyPct);
  const cargo: Record<string, number> = JSON.parse(victim.cargo_json ?? '{}');
  const lootCargo: Record<string, number> = {};
  for (const [commodity, amount] of Object.entries(cargo)) {
    const lootAmount = Math.floor((amount as number) * LOOT_CARGO_PCT);
    if (lootAmount > 0) {
      lootCargo[commodity] = lootAmount;
      cargo[commodity] = (amount as number) - lootAmount;
      if (cargo[commodity] === 0) delete cargo[commodity];
    }
  }

  // Find FedSpace respawn sector
  const fedSpace = await db
    .prepare('SELECT sector_index FROM sectors WHERE galaxy_id = ? AND danger = "safe" ORDER BY sector_index LIMIT 1')
    .bind(galaxyId)
    .first<{ sector_index: number }>();

  const respawnSector = fedSpace?.sector_index ?? 0;

  // Apply to victim
  await db
    .prepare(
      'UPDATE player_ships SET credits = credits - ?, cargo_json = ?, current_sector = ?, hull = max_turns, shield = 0, deaths = deaths + 1, updated_at = datetime("now") WHERE player_id = ? AND galaxy_id = ?'
    )
    .bind(lootCredits, JSON.stringify(cargo), respawnSector, victimId, galaxyId)
    .run();

  // Apply to attacker
  let attackerLooted = false;
  if (attackerId && attackerId !== victimId) {
    await db
      .prepare(
        'UPDATE player_ships SET credits = credits + ?, kills = kills + 1, updated_at = datetime("now") WHERE player_id = ? AND galaxy_id = ?'
      )
      .bind(lootCredits, attackerId, galaxyId)
      .run();
    attackerLooted = true;
  }

  // Record kill
  await db
    .prepare(
      'INSERT INTO pvp_kills (galaxy_id, killer_player_id, victim_player_id, sector_id, credits_looted, cargo_looted_json) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .bind(galaxyId, attackerId, victimId, sectorId, lootCredits, JSON.stringify(lootCargo))
    .run();

  // Update net_worth on victim
  await db
    .prepare(
      'UPDATE player_ships SET net_worth = credits + (SELECT COALESCE(SUM(price * supply), 0) FROM sectors WHERE galaxy_id = ? AND port_inventory_json IS NOT NULL) WHERE player_id = ? AND galaxy_id = ?'
    )
    .bind(galaxyId, victimId, galaxyId)
    .run();

  // Generate news
  const victimName = await getShipName(db, victimId, galaxyId);
  const attackerName = attackerId ? await getShipName(db, attackerId, galaxyId) : null;

  let headline: string;
  if (cause === 'npc') {
    headline = attackerName
      ? `${victimName} was destroyed by an NPC raider in Sector ${sectorId}`
      : `${victimName} was destroyed in Sector ${sectorId}`;
  } else {
    headline = attackerName
      ? `${attackerName} destroyed ${victimName} in Sector ${sectorId}`
      : `${victimName} was destroyed in Sector ${sectorId}`;
  }

  await db
    .prepare('INSERT INTO news (galaxy_id, headline, type, sector_id, player_id) VALUES (?, ?, ?, ?, ?)')
    .bind(galaxyId, headline, 'combat', sectorId, victimId)
    .run();

  // Check wanted status
  if (attackerId && attackerId !== victimId) {
    const recentKills = await db
      .prepare('SELECT COUNT(*) as count FROM pvp_kills WHERE killer_player_id = ? AND timestamp > datetime("now", "-24 hours")')
      .bind(attackerId)
      .first<{ count: number }>();

    if (recentKills && recentKills.count >= WANTED_KILL_THRESHOLD) {
      const wantedHeadline = `${attackerName} is now WANTED — ${recentKills.count} kills in 24 hours`;
      await db
        .prepare('INSERT INTO news (galaxy_id, headline, type, sector_id, player_id) VALUES (?, ?, ?, ?, ?)')
        .bind(galaxyId, wantedHeadline, 'bounty', sectorId, attackerId)
        .run();
    }
  }

  // Discord webhook (fire-and-forget)
  if (attackerId) {
    sendDiscordNotification(victimId, attackerName ?? 'Unknown', sectorId, lootCredits, lootCargo);
  }

  return {
    respawned: true,
    fedSpaceSector: respawnSector,
    lootCredits,
    lootCargo,
    attackerLooted,
    protected: false,
    insuranceApplied: insuranceActive,
  };
}

async function getShipName(db: D1Database, playerId: number, galaxyId: number): Promise<string> {
  const row = await db
    .prepare('SELECT ship_name FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
    .bind(playerId, galaxyId)
    .first<{ ship_name: string }>();
  return row?.ship_name ?? 'Unknown';
}

async function sendDiscordNotification(
  victimId: number,
  attackerName: string,
  sectorId: number,
  lootCredits: number,
  lootCargo: Record<string, number>
) {
  // TODO: implement Discord webhook lookup and POST
  // For now this is a no-op placeholder
}

// ─── API: Player Stats ───────────────────────────────────

export async function handlePlayerStats(
  auth: AuthContext,
  galaxyId: string | null,
  db: D1Database
): Promise<Response> {
  if (!galaxyId) return jsonError('galaxyId query param required');

  const gId = parseInt(galaxyId, 10);
  if (isNaN(gId)) return jsonError('Invalid galaxy id');

  const ship = await db
    .prepare('SELECT kills, deaths, reputation, wanted_kills, net_worth, insurance_expires FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
    .bind(auth.playerId, gId)
    .first<{
      kills: number;
      deaths: number;
      reputation: number;
      wanted_kills: number;
      net_worth: number;
      insurance_expires: string | null;
    }>();

  if (!ship) return jsonError('No ship found', 404);

  const kdr = ship.deaths > 0 ? ship.kills / ship.deaths : ship.kills;
  const insuranceActive = ship.insurance_expires ? new Date(ship.insurance_expires) > new Date() : false;

  // Check wanted status
  const recentKills = await db
    .prepare('SELECT COUNT(*) as count FROM pvp_kills WHERE killer_player_id = ? AND timestamp > datetime("now", "-24 hours")')
    .bind(auth.playerId)
    .first<{ count: number }>();

  const wanted = (recentKills?.count ?? 0) >= WANTED_KILL_THRESHOLD;

  return json({
    kills: ship.kills,
    deaths: ship.deaths,
    kdr: parseFloat(kdr.toFixed(2)),
    reputation: ship.reputation,
    wanted,
    wantedKillCount: recentKills?.count ?? 0,
    netWorth: ship.net_worth,
    insuranceActive,
    insuranceExpires: ship.insurance_expires,
  });
}

// ─── API: Bounty Board ───────────────────────────────────

export async function handleBountyBoard(
  galaxyId: string | null,
  db: D1Database
): Promise<Response> {
  if (!galaxyId) return jsonError('galaxyId query param required');

  const gId = parseInt(galaxyId, 10);
  if (isNaN(gId)) return jsonError('Invalid galaxy id');

  // Find all players with 3+ kills in last 24h in this galaxy
  const result = await db
    .prepare(
      `SELECT pk.killer_player_id as player_id, p.display_name, ps.ship_name,
              COUNT(*) as kill_count, MAX(pk.timestamp) as last_kill_at,
              ps.current_sector
       FROM pvp_kills pk
       JOIN players p ON pk.killer_player_id = p.id
       JOIN player_ships ps ON pk.killer_player_id = ps.player_id AND pk.galaxy_id = ps.galaxy_id
       WHERE pk.galaxy_id = ? AND pk.timestamp > datetime('now', '-24 hours')
       GROUP BY pk.killer_player_id
       HAVING COUNT(*) >= ?
       ORDER BY kill_count DESC`
    )
    .bind(gId, WANTED_KILL_THRESHOLD)
    .all();

  return json({ wanted: result.results ?? [] });
}

// ─── API: Bounty Status ──────────────────────────────────

export async function handleBountyStatus(
  auth: AuthContext,
  db: D1Database
): Promise<Response> {
  const recentKills = await db
    .prepare('SELECT COUNT(*) as count FROM pvp_kills WHERE killer_player_id = ? AND timestamp > datetime("now", "-24 hours")')
    .bind(auth.playerId)
    .first<{ count: number }>();

  const count = recentKills?.count ?? 0;
  const wanted = count >= WANTED_KILL_THRESHOLD;

  // Calculate hours until decay (if wanted)
  let hoursRemaining: number | null = null;
  if (wanted) {
    const oldestKill = await db
      .prepare('SELECT timestamp FROM pvp_kills WHERE killer_player_id = ? ORDER BY timestamp ASC LIMIT 1')
      .bind(auth.playerId)
      .first<{ timestamp: string }>();

    if (oldestKill) {
      const oldest = new Date(oldestKill.timestamp);
      const decayAt = new Date(oldest.getTime() + WANTED_DECAY_HOURS * 60 * 60 * 1000);
      hoursRemaining = Math.max(0, Math.ceil((decayAt.getTime() - Date.now()) / (1000 * 60 * 60)));
    }
  }

  return json({ wanted, killCount: count, hoursRemaining });
}

// ─── API: Digest ─────────────────────────────────────────

export async function handleDigest(
  auth: AuthContext,
  galaxyId: string | null,
  db: D1Database
): Promise<Response> {
  if (!galaxyId) return jsonError('galaxyId query param required');

  const gId = parseInt(galaxyId, 10);
  if (isNaN(gId)) return jsonError('Invalid galaxy id');

  const player = await db
    .prepare('SELECT last_login_at FROM players WHERE id = ?')
    .bind(auth.playerId)
    .first<{ last_login_at: string | null }>();

  const lastLogin = player?.last_login_at ?? '1970-01-01';

  // Kills by player
  const killsResult = await db
    .prepare('SELECT COUNT(*) as count FROM pvp_kills WHERE killer_player_id = ? AND galaxy_id = ? AND timestamp > ?')
    .bind(auth.playerId, gId, lastLogin)
    .first<{ count: number }>();

  // Deaths of player
  const deathsResult = await db
    .prepare('SELECT COUNT(*) as count FROM pvp_kills WHERE victim_player_id = ? AND galaxy_id = ? AND timestamp > ?')
    .bind(auth.playerId, gId, lastLogin)
    .first<{ count: number }>();

  // Recent news
  const newsResult = await db
    .prepare('SELECT * FROM news WHERE galaxy_id = ? AND timestamp > ? ORDER BY timestamp DESC LIMIT 20')
    .bind(gId, lastLogin)
    .all();

  // Update last_login_at
  await db
    .prepare('UPDATE players SET last_login_at = datetime("now") WHERE id = ?')
    .bind(auth.playerId)
    .run();

  return json({
    kills: killsResult?.count ?? 0,
    deaths: deathsResult?.count ?? 0,
    news: newsResult.results ?? [],
  });
}

// ─── API: Insurance ──────────────────────────────────────

export async function handleInsuranceBuy(
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

  const { galaxyId, sectorId } = body;
  if (!galaxyId || sectorId === undefined) return jsonError('galaxyId and sectorId required');

  // Verify stardock
  const sector = await db
    .prepare('SELECT stardock FROM sectors WHERE galaxy_id = ? AND sector_index = ?')
    .bind(galaxyId, sectorId)
    .first<{ stardock: number }>();

  if (!sector || sector.stardock !== 1) {
    return jsonError('Insurance only available at StarDock', 400);
  }

  const ship = await db
    .prepare('SELECT credits, net_worth, current_sector, insurance_expires FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
    .bind(auth.playerId, galaxyId)
    .first<{
      credits: number;
      net_worth: number;
      current_sector: number;
      insurance_expires: string | null;
    }>();

  if (!ship) return jsonError('Ship not found', 404);
  if (ship.current_sector !== sectorId) return jsonError('Not at StarDock', 403);

  const cost = Math.floor(ship.net_worth * INSURANCE_COST_PCT);
  if (ship.credits < cost) return jsonError(`Need ${cost} credits`, 403);

  const now = new Date();
  const expires = new Date(now.getTime() + INSURANCE_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await db
    .prepare(
      'UPDATE player_ships SET credits = credits - ?, insurance_expires = ?, updated_at = datetime("now") WHERE player_id = ? AND galaxy_id = ?'
    )
    .bind(cost, expires.toISOString(), auth.playerId, galaxyId)
    .run();

  return json({
    success: true,
    cost,
    expires: expires.toISOString(),
    remainingCredits: ship.credits - cost,
  });
}

export async function handleInsuranceStatus(
  auth: AuthContext,
  galaxyId: string | null,
  db: D1Database
): Promise<Response> {
  if (!galaxyId) return jsonError('galaxyId query param required');

  const gId = parseInt(galaxyId, 10);
  if (isNaN(gId)) return jsonError('Invalid galaxy id');

  const ship = await db
    .prepare('SELECT insurance_expires FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
    .bind(auth.playerId, gId)
    .first<{ insurance_expires: string | null }>();

  if (!ship) return jsonError('Ship not found', 404);

  const active = ship.insurance_expires ? new Date(ship.insurance_expires) > new Date() : false;

  return json({
    active,
    expires: ship.insurance_expires,
  });
}
