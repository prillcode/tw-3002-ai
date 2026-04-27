/**
 * TW 3002 AI Cloud API
 * Cloudflare Worker serving REST endpoints for shared galaxy state.
 */

import { corsHeaders, json, jsonError, applyCors } from './utils/cors.js';
import { verifyToken, type AuthContext } from './utils/auth.js';
import { handleRegister, handleVerify } from './routes/auth.js';
import { handleListGalaxies, handleGetGalaxy, handleGetSectors, handleGetSector } from './routes/galaxy.js';
import {
  handleGetPlayer,
  handleGetShip,
  handleCreateShip,
  handleMoveShip,
  handleGetAlignment,
  handlePayTaxes,
  handleRequestCommission,
} from './routes/player.js';
import { handleTrade, handleCombat, handleUpgrade } from './routes/action.js';
import {
  handlePlayerStats,
  handleBountyBoard,
  handleBountyStatus,
  handleDigest,
  handleInsuranceBuy,
  handleInsuranceStatus,
} from './routes/combat.js';
import { handleNPCTick, runNPCTick } from './routes/npc.js';
import { handleGetNews, handleAddNews, handleLeaderboard } from './routes/news.js';
import {
  handleBuyFighters,
  handleDeployFighters,
  handleGetSectorFighters,
  handleRecallFighters,
  handleResolveEncounter,
} from './routes/fighters.js';
import {
  handleCreatePlanet,
  handleGetSectorPlanets,
  handleGetPlanet,
  handleColonize,
  handleProductionTick,
  handleGetCitadelCosts,
  handleAdvanceCitadel,
  handleConfigureQCannon,
  handlePlanetTransport,
} from './routes/planets.js';
import {
  handleBuyMines,
  handleDeployMines,
  handleGetSectorMines,
  handleClearLimpets,
} from './routes/mines.js';

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
      return applyCors(new Response(null, { status: 204, headers: corsHeaders }), request);
    }

    let response: Response;
    try {
      // Health check (no auth)
      if (path === '/health') {
        response = json({ status: 'ok', version: '0.5.5' });
      }

      // Auth routes (no auth required)
      else if (path === '/api/auth/register') {
        response = await handleRegister(request, env.DB);
      }
      else if (path === '/api/auth/verify') {
        response = await handleVerify(request, env.DB);
      }

      // Galaxy routes (no auth required for read)
      else if (path === '/api/galaxy' && method === 'GET') {
        response = await handleListGalaxies(env.DB);
      }
      else if (path.startsWith('/api/galaxy/')) {
        const parts = path.split('/');
        const galaxyId = parts[3];

        if (parts[4] === 'sectors' && method === 'GET') {
          response = await handleGetSectors(galaxyId, env.DB);
        }
        else if (parts[4] === 'sector' && method === 'GET') {
          response = await handleGetSector(galaxyId, url.searchParams.get('id'), env.DB);
        }
        else if (parts.length === 4 && method === 'GET') {
          response = await handleGetGalaxy(galaxyId, env.DB);
        }
        else {
          response = jsonError('Not found', 404);
        }
      }

      // Leaderboard (no auth)
      else if (path === '/api/leaderboard' && method === 'GET') {
        response = await handleLeaderboard(url.searchParams.get('galaxyId'), url.searchParams.get('limit'), url.searchParams.get('sort'), env.DB);
      }

      // News (read is public, write is auth-gated)
      else if (path === '/api/news' && method === 'GET') {
        response = await handleGetNews(url.searchParams.get('galaxyId'), url.searchParams.get('limit'), env.DB);
      }

      // Everything below requires authentication
      else {
        const auth = await verifyToken(env.DB, request.headers.get('Authorization'));
        if (!auth) {
          response = jsonError('Unauthorized', 401);
        }
        else if (path === '/api/news' && method === 'POST') {
          response = await handleAddNews(request, env.DB);
        }
        else if (path === '/api/player' && method === 'GET') {
          response = await handleGetPlayer(auth, env.DB);
        }
        else if (path === '/api/player/ship' && method === 'GET') {
          response = await handleGetShip(auth, url.searchParams.get('galaxyId'), env.DB);
        }
        else if (path === '/api/player/ship' && method === 'POST') {
          response = await handleCreateShip(auth, request, env.DB);
        }
        else if (path === '/api/player/ship/move' && method === 'POST') {
          response = await handleMoveShip(auth, request, env.DB);
        }
        else if (path === '/api/player/alignment' && method === 'GET') {
          response = await handleGetAlignment(auth, url.searchParams.get('galaxyId'), env.DB);
        }
        else if (path === '/api/player/pay-taxes' && method === 'POST') {
          response = await handlePayTaxes(auth, request, env.DB);
        }
        else if (path === '/api/player/commission' && method === 'POST') {
          response = await handleRequestCommission(auth, request, env.DB);
        }
        else if (path === '/api/action/trade' && method === 'POST') {
          response = await handleTrade(auth, request, env.DB);
        }
        else if (path === '/api/action/combat' && method === 'POST') {
          response = await handleCombat(auth, request, env.DB);
        }
        else if (path === '/api/action/upgrade' && method === 'POST') {
          response = await handleUpgrade(auth, request, env.DB);
        }
        else if (path === '/api/player/stats' && method === 'GET') {
          response = await handlePlayerStats(auth, url.searchParams.get('galaxyId'), env.DB);
        }
        else if (path === '/api/bounty/board' && method === 'GET') {
          response = await handleBountyBoard(url.searchParams.get('galaxyId'), env.DB);
        }
        else if (path === '/api/bounty/status' && method === 'GET') {
          response = await handleBountyStatus(auth, env.DB);
        }
        else if (path === '/api/notifications/digest' && method === 'GET') {
          response = await handleDigest(auth, url.searchParams.get('galaxyId'), env.DB);
        }
        else if (path === '/api/insurance/buy' && method === 'POST') {
          response = await handleInsuranceBuy(auth, request, env.DB);
        }
        else if (path === '/api/insurance/status' && method === 'GET') {
          response = await handleInsuranceStatus(auth, url.searchParams.get('galaxyId'), env.DB);
        }
        else if (path === '/api/fighters/buy' && method === 'POST') {
          response = await handleBuyFighters(auth, request, env.DB);
        }
        else if (path === '/api/fighters/deploy' && method === 'POST') {
          response = await handleDeployFighters(auth, request, env.DB);
        }
        else if (path === '/api/fighters/sector' && method === 'GET') {
          response = await handleGetSectorFighters(auth, url.searchParams.get('galaxyId'), url.searchParams.get('sectorId'), env.DB);
        }
        else if (path === '/api/fighters/recall' && method === 'POST') {
          response = await handleRecallFighters(auth, request, env.DB);
        }
        else if (path === '/api/fighters/encounter/resolve' && method === 'POST') {
          response = await handleResolveEncounter(auth, request, env.DB);
        }
        // Planet routes
        else if (path === '/api/planets/create' && method === 'POST') {
          response = await handleCreatePlanet(auth, request, env.DB);
        }
        else if (path === '/api/planets/sector' && method === 'GET') {
          response = await handleGetSectorPlanets(auth, url.searchParams.get('galaxyId'), url.searchParams.get('sectorId'), env.DB);
        }
        else if (path === '/api/planets/colonize' && method === 'POST') {
          response = await handleColonize(auth, request, env.DB);
        }
        else if (path === '/api/planets/citadel/advance' && method === 'POST') {
          response = await handleAdvanceCitadel(auth, request, env.DB);
        }
        else if (path === '/api/planets/qcannon' && method === 'POST') {
          response = await handleConfigureQCannon(auth, request, env.DB);
        }
        else if (path === '/api/planets/transport' && method === 'POST') {
          response = await handlePlanetTransport(auth, request, env.DB);
        }
        else if (path === '/api/planets/citadel-costs' && method === 'GET') {
          response = await handleGetCitadelCosts(auth, url.searchParams.get('planetId') ?? '', env.DB);
        }
        else if (path.startsWith('/api/planets/') && method === 'GET') {
          const planetId = path.split('/').pop()!;
          response = await handleGetPlanet(auth, planetId, env.DB);
        }
        else if (path === '/api/mines/buy' && method === 'POST') {
          response = await handleBuyMines(auth, request, env.DB);
        }
        else if (path === '/api/mines/deploy' && method === 'POST') {
          response = await handleDeployMines(auth, request, env.DB);
        }
        else if (path === '/api/mines/sector' && method === 'GET') {
          response = await handleGetSectorMines(auth, url.searchParams.get('galaxyId'), url.searchParams.get('sectorId'), env.DB);
        }
        else if (path === '/api/mines/clear-limpets' && method === 'POST') {
          response = await handleClearLimpets(auth, request, env.DB);
        }
        else if (path === '/api/npc/tick' && method === 'POST') {
          response = await handleNPCTick(request, env.DB, env.ADMIN_SECRET);
        }
        else {
          response = jsonError('Not found', 404);
        }
      }
    } catch (err) {
      console.error('API error:', err);
      response = jsonError('Internal server error', 500);
    }

    return applyCors(response, request);
  },

  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runNPCTick(env.DB, 1));
    ctx.waitUntil(handleProductionTick(env.DB, 1));
    return;
  },
};
