/**
 * TW 3002 AI Cloud API
 * Cloudflare Worker serving REST endpoints for shared galaxy state.
 */

import { corsHeaders, json, jsonError } from './utils/cors.js';
import { verifyToken, type AuthContext } from './utils/auth.js';
import { handleRegister, handleVerify } from './routes/auth.js';
import { handleListGalaxies, handleGetGalaxy, handleGetSectors, handleGetSector } from './routes/galaxy.js';
import { handleGetPlayer, handleGetShip, handleCreateShip, handleMoveShip } from './routes/player.js';
import { handleTrade, handleCombat } from './routes/action.js';
import { handleGetNews, handleAddNews, handleLeaderboard } from './routes/news.js';

export interface Env {
  DB: D1Database;
  ADMIN_SECRET?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      // Health check (no auth)
      if (path === '/health') {
        return json({ status: 'ok', version: '0.1.0' });
      }

      // Auth routes (no auth required)
      if (path === '/api/auth/register') {
        return await handleRegister(request, env.DB);
      }
      if (path === '/api/auth/verify') {
        return await handleVerify(request, env.DB);
      }

      // Galaxy routes (no auth required for read)
      if (path === '/api/galaxy' && method === 'GET') {
        return await handleListGalaxies(env.DB);
      }
      if (path.startsWith('/api/galaxy/')) {
        const parts = path.split('/');
        const galaxyId = parts[3];

        if (parts[4] === 'sectors' && method === 'GET') {
          return await handleGetSectors(galaxyId, env.DB);
        }
        if (parts[4] === 'sector' && method === 'GET') {
          return await handleGetSector(galaxyId, url.searchParams.get('id'), env.DB);
        }
        if (parts.length === 4 && method === 'GET') {
          return await handleGetGalaxy(galaxyId, env.DB);
        }
      }

      // Leaderboard (no auth)
      if (path === '/api/leaderboard' && method === 'GET') {
        return await handleLeaderboard(url.searchParams.get('galaxyId'), url.searchParams.get('limit'), env.DB);
      }

      // News (read is public, write is auth-gated)
      if (path === '/api/news' && method === 'GET') {
        return await handleGetNews(url.searchParams.get('galaxyId'), url.searchParams.get('limit'), env.DB);
      }

      // Everything below requires authentication
      const auth = await verifyToken(env.DB, request.headers.get('Authorization'));
      if (!auth) {
        return jsonError('Unauthorized', 401);
      }

      // News write
      if (path === '/api/news' && method === 'POST') {
        return await handleAddNews(request, env.DB);
      }

      // Player routes
      if (path === '/api/player' && method === 'GET') {
        return await handleGetPlayer(auth, env.DB);
      }
      if (path === '/api/player/ship' && method === 'GET') {
        return await handleGetShip(auth, url.searchParams.get('galaxyId'), env.DB);
      }
      if (path === '/api/player/ship' && method === 'POST') {
        return await handleCreateShip(auth, request, env.DB);
      }
      if (path === '/api/player/ship/move' && method === 'POST') {
        return await handleMoveShip(auth, request, env.DB);
      }

      // Action routes
      if (path === '/api/action/trade' && method === 'POST') {
        return await handleTrade(auth, request, env.DB);
      }
      if (path === '/api/action/combat' && method === 'POST') {
        return await handleCombat(auth, request, env.DB);
      }

      return jsonError('Not found', 404);
    } catch (err) {
      console.error('API error:', err);
      return jsonError('Internal server error', 500);
    }
  },
};
