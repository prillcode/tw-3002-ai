/**
 * TW 3002 AI Cloud API
 * Cloudflare Worker serving REST endpoints for shared galaxy state.
 */

export interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    try {
      // Health check
      if (path === '/health') {
        return json({ status: 'ok', version: '0.1.0' }, headers);
      }

      // Galaxy info
      if (path === '/api/galaxy' && request.method === 'GET') {
        const result = await env.DB.prepare(
          'SELECT id, name, sector_count, created_at FROM galaxies WHERE active = 1'
        ).all();
        return json({ galaxies: result.results }, headers);
      }

      // Sector data
      if (path.startsWith('/api/galaxy/') && path.endsWith('/sector')) {
        const galaxyId = path.split('/')[3];
        const sectorId = url.searchParams.get('id');
        if (!sectorId) {
          return json({ error: 'Missing sector id' }, headers, 400);
        }
        const result = await env.DB.prepare(
          'SELECT * FROM sectors WHERE galaxy_id = ? AND id = ?'
        ).bind(galaxyId, sectorId).first();
        return json({ sector: result }, headers);
      }

      // Player state
      if (path === '/api/player' && request.method === 'GET') {
        // TODO: auth
        return json({ error: 'Not implemented' }, headers, 501);
      }

      // 404
      return json({ error: 'Not found' }, headers, 404);

    } catch (err) {
      console.error('API error:', err);
      return json({ error: 'Internal server error' }, headers, 500);
    }
  },
};

function json(data: unknown, headers: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers });
}
