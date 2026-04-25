import type { D1Database } from '@cloudflare/workers-types';
import { json, jsonError } from '../utils/cors.js';

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
    .prepare('SELECT sector_index, name, danger, port_class, port_name, connections_json, stardock FROM sectors WHERE galaxy_id = ? ORDER BY sector_index')
    .bind(id)
    .all();

  return json({ sectors: result.results ?? [] });
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

  return json({ sector, npcs: npcs.results ?? [] });
}
