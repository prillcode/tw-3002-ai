import type { D1Database } from '@cloudflare/workers-types';
import { json, jsonError } from '../utils/cors.js';
import { getBlockadeMetadataForSector } from './mines.js';

/**
 * GET /api/galaxy
 * List all active galaxies.
 */
export async function handleListGalaxies(db: D1Database): Promise<Response> {
  const result = await db
    .prepare('SELECT id, name, slug, sector_count, created_at FROM galaxies WHERE active = 1')
    .all<{ id: number; name: string; slug: string; sector_count: number; created_at: string }>();

  return json({ galaxies: result.results ?? [] });
}

/**
 * GET /api/galaxy/:id
 * Get galaxy details including player count.
 */
export async function handleGetGalaxy(galaxyId: string, db: D1Database): Promise<Response> {
  const id = parseInt(galaxyId, 10);
  if (isNaN(id)) return jsonError('Invalid galaxy id');

  const galaxy = await db
    .prepare('SELECT * FROM galaxies WHERE id = ? AND active = 1')
    .bind(id)
    .first();

  if (!galaxy) return jsonError('Galaxy not found', 404);

  const playerCount = await db
    .prepare('SELECT COUNT(*) as count FROM player_ships WHERE galaxy_id = ?')
    .bind(id)
    .first<{ count: number }>();

  return json({ galaxy, playerCount: playerCount?.count ?? 0 });
}

/**
 * GET /api/galaxy/:id/sectors
 * Get all sectors for a galaxy (for client-side caching).
 */
export async function handleGetSectors(galaxyId: string, db: D1Database): Promise<Response> {
  const id = parseInt(galaxyId, 10);
  if (isNaN(id)) return jsonError('Invalid galaxy id');

  const result = await db
    .prepare(
      `SELECT s.sector_index, s.name, s.danger, s.port_class, s.port_name, s.connections_json, s.stardock,
              COALESCE(f.total_fighters, 0) as fighter_total,
              COALESCE(m.total_limpets, 0) as limpet_total,
              COALESCE(m.total_armids, 0) as armid_total
       FROM sectors s
       LEFT JOIN (
         SELECT galaxy_id, sector_index, SUM(count) as total_fighters
         FROM sector_fighters
         GROUP BY galaxy_id, sector_index
       ) f ON f.galaxy_id = s.galaxy_id AND f.sector_index = s.sector_index
       LEFT JOIN (
         SELECT galaxy_id, sector_index, SUM(limpet_count) as total_limpets, SUM(armid_count) as total_armids
         FROM sector_mines
         GROUP BY galaxy_id, sector_index
       ) m ON m.galaxy_id = s.galaxy_id AND m.sector_index = s.sector_index
       WHERE s.galaxy_id = ?
       ORDER BY s.sector_index`
    )
    .bind(id)
    .all<any>();

  const sectors = (result.results ?? []).map((row) => {
    const blockadeScore = (row.fighter_total ?? 0) + (row.limpet_total ?? 0) * 2 + (row.armid_total ?? 0) * 5;
    const blockadeLevel = blockadeScore >= 5000 ? 'fortress' : blockadeScore >= 2000 ? 'active' : blockadeScore >= 500 ? 'light' : 'none';
    return {
      ...row,
      blockade_score: blockadeScore,
      blockade_level: blockadeLevel,
      hostile_defense_estimate: (row.fighter_total ?? 0) + (row.limpet_total ?? 0) + (row.armid_total ?? 0),
    };
  });

  return json({ sectors });
}

/**
 * GET /api/galaxy/:id/sector?id=
 * Get a single sector with full details.
 */
export async function handleGetSector(
  galaxyId: string,
  sectorId: string | null,
  db: D1Database
): Promise<Response> {
  const gId = parseInt(galaxyId, 10);
  if (isNaN(gId)) return jsonError('Invalid galaxy id');
  if (!sectorId) return jsonError('Missing sector id param');

  const sId = parseInt(sectorId, 10);
  if (isNaN(sId)) return jsonError('Invalid sector id');

  const sector = await db
    .prepare('SELECT * FROM sectors WHERE galaxy_id = ? AND sector_index = ?')
    .bind(gId, sId)
    .first();

  if (!sector) return jsonError('Sector not found', 404);

  // Get NPCs in this sector
  const npcs = await db
    .prepare('SELECT npc_id, persona_json, current_sector, ship_json, credits FROM npcs WHERE galaxy_id = ? AND current_sector = ? AND is_active = 1')
    .bind(gId, sId)
    .all();

  const blockade = await getBlockadeMetadataForSector(db, gId, sId);

  return json({
    sector: {
      ...sector,
      blockade_level: blockade.blockadeLevel,
      blockade_score: blockade.blockadeScore,
      hostile_defense_estimate: blockade.hostileDefenseEstimate,
    },
    npcs: npcs.results ?? [],
  });
}
