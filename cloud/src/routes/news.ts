import type { D1Database } from '@cloudflare/workers-types';
import type { AuthContext } from '../utils/auth.js';
import { json, jsonError, actionBudgetExceededResponse } from '../utils/cors.js';
import { checkAndDeductActionPoints } from '../utils/actionBudget.js';

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
export async function handleAddNews(
  auth: AuthContext,
  request: Request,
  db: D1Database
): Promise<Response> {
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

  const budget = await checkAndDeductActionPoints(db, auth.playerId, galaxyId, 'add-news');
  if (!budget.allowed) return actionBudgetExceededResponse(budget);

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
  sort: string | null,
  db: D1Database
): Promise<Response> {
  if (!galaxyId) return jsonError('galaxyId query param required');

  const gId = parseInt(galaxyId, 10);
  if (isNaN(gId)) return jsonError('Invalid galaxy id');

  const count = Math.min(parseInt(limit ?? '10', 10), 100);

  if (sort === 'wanted') {
    // wanted = players with most kills in last 24h
    const result = await db
      .prepare(
        `SELECT ps.ship_name, ps.class_id, ps.net_worth, ps.kills, ps.deaths,
                ps.alignment, ps.experience, ps.rank, ps.commissioned,
                p.display_name, p.email,
                (SELECT COUNT(*) FROM pvp_kills pk WHERE pk.killer_player_id = ps.player_id AND pk.timestamp > datetime('now', '-24 hours')) as recent_kills
         FROM player_ships ps
         JOIN players p ON ps.player_id = p.id
         WHERE ps.galaxy_id = ?
         ORDER BY recent_kills DESC
         LIMIT ?`
      )
      .bind(gId, count)
      .all();
    return json({ leaderboard: result.results ?? [] });
  }

  let orderBy = 'ps.net_worth DESC';
  if (sort === 'kills') orderBy = 'ps.kills DESC';
  else if (sort === 'deaths') orderBy = 'ps.deaths DESC';
  else if (sort === 'planets') orderBy = 'planets_held DESC';
  else if (sort === 'experience') orderBy = 'ps.experience DESC';

  const result = await db
    .prepare(
      `SELECT ps.ship_name, ps.class_id, ps.net_worth, ps.kills, ps.deaths,
              ps.alignment, ps.experience, ps.rank, ps.commissioned,
              p.display_name, p.email,
              (SELECT COUNT(*) FROM planets pl WHERE pl.owner_id = ps.player_id AND pl.galaxy_id = ps.galaxy_id) as planets_held
       FROM player_ships ps
       JOIN players p ON ps.player_id = p.id
       WHERE ps.galaxy_id = ?
       ORDER BY ${orderBy}
       LIMIT ?`
    )
    .bind(gId, count)
    .all();

  return json({ leaderboard: result.results ?? [] });
}
