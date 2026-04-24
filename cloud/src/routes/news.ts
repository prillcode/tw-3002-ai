import type { D1Database } from '@cloudflare/workers-types';
import { json, jsonError } from '../utils/cors.js';

/**
 * GET /api/news?galaxyId=&limit=
 * Get recent news for a galaxy.
 */
export async function handleGetNews(
  galaxyId: string | null,
  limit: string | null,
  db: D1Database
): Promise<Response> {
  if (!galaxyId) return jsonError('galaxyId query param required');

  const gId = parseInt(galaxyId, 10);
  if (isNaN(gId)) return jsonError('Invalid galaxy id');

  const count = Math.min(parseInt(limit ?? '20', 10), 100);

  const result = await db
    .prepare('SELECT * FROM news WHERE galaxy_id = ? ORDER BY timestamp DESC LIMIT ?')
    .bind(gId, count)
    .all();

  return json({ news: result.results ?? [] });
}

/**
 * POST /api/news
 * Admin/internal: add a news item.
 * Body: { galaxyId, headline, type, sectorId?, playerId? }
 */
export async function handleAddNews(request: Request, db: D1Database): Promise<Response> {
  if (request.method !== 'POST') return jsonError('Method not allowed', 405);

  let body: {
    galaxyId?: number;
    headline?: string;
    type?: string;
    sectorId?: number;
    playerId?: number;
  };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const { galaxyId, headline, type = 'event', sectorId, playerId } = body;
  if (!galaxyId || !headline) return jsonError('galaxyId and headline required');

  await db
    .prepare(
      'INSERT INTO news (galaxy_id, headline, type, sector_id, player_id) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(galaxyId, headline, type, sectorId ?? null, playerId ?? null)
    .run();

  return json({ success: true });
}

/**
 * GET /api/leaderboard?galaxyId=&limit=
 * Get top players by net worth in a galaxy.
 */
export async function handleLeaderboard(
  galaxyId: string | null,
  limit: string | null,
  db: D1Database
): Promise<Response> {
  if (!galaxyId) return jsonError('galaxyId query param required');

  const gId = parseInt(galaxyId, 10);
  if (isNaN(gId)) return jsonError('Invalid galaxy id');

  const count = Math.min(parseInt(limit ?? '10', 10), 100);

  const result = await db
    .prepare(
      `SELECT ps.ship_name, ps.class_id, ps.net_worth, ps.kills, ps.deaths,
              p.display_name, p.email
       FROM player_ships ps
       JOIN players p ON ps.player_id = p.id
       WHERE ps.galaxy_id = ?
       ORDER BY ps.net_worth DESC
       LIMIT ?`
    )
    .bind(gId, count)
    .all();

  return json({ leaderboard: result.results ?? [] });
}
