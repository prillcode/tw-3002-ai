/**
 * TW 3002 AI Cloud API
 * Cloudflare Worker serving REST endpoints for shared galaxy state.
 */

import { corsHeaders, json, jsonError, applyCors, rateLimitedResponse, addRateLimitHeaders } from './utils/cors.js';
import { verifyToken, type AuthContext } from './utils/auth.js';
import { checkRateLimit, getClientIP } from './utils/rateLimit.js';
import { handleRegister, handleVerify, handleVerifyEmail } from './routes/auth.js';
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
import { handleTrade, handleCombat, handleUpgrade, handleCrimeStatus, handleRob, handleSteal } from './routes/action.js';
import {
  handlePlayerStats,
  handleBountyBoard,
  handleBountyStatus,
  handleDigest,
  handleInsuranceBuy,
  handleInsuranceStatus,
} from './routes/combat.js';
import { handleNPCTick, handleNPCLLMHealth, handleNPCModelBenchmark, runNPCTick } from './routes/npc.js';
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
import { handleGetMissions, handleClaimMission, handleRerollMission } from './routes/missions.js';

export interface Env {
  DB: D1Database;
  AI: { run: (model: string, input: Record<string, unknown>) => Promise<unknown> };
  ADMIN_SECRET?: string;
  NPC_MODEL?: string;
  NPC_QUOTE_MODEL?: string;
  NPC_LLM_ENABLED?: string;
  RESEND_API_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
}

// ─── Rate limit helpers ─────────────────────────────────────

/** Wrap an auth-gated gameplay handler with rate limiting (10/min per playerId). */
async function withGameplayRateLimit(
  playerId: number,
  handler: () => Promise<Response>,
): Promise<Response> {
  const rl = checkRateLimit(`gameplay:${playerId}`, 10);
  if (!rl.allowed) return rateLimitedResponse(rl);
  return addRateLimitHeaders(await handler(), rl);
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

    const ip = getClientIP(request);

    let response: Response;
    try {
      // ─── Public routes (no auth) ──────────────────────────

      // Health check
      if (path === '/health') {
        const rl = checkRateLimit(`public:${ip}`, 60);
        if (!rl.allowed) { response = rateLimitedResponse(rl); }
        else { response = addRateLimitHeaders(json({ status: 'ok', version: '0.6.5' }), rl); }
      }

      // Auth routes (rate-limited by IP)
      else if (path === '/api/auth/register') {
        const rl = checkRateLimit(`auth:${ip}`, 5);
        if (!rl.allowed) { response = rateLimitedResponse(rl); }
        else { response = addRateLimitHeaders(await handleRegister(request, env), rl); }
      }
      else if (path === '/api/auth/verify') {
        const rl = checkRateLimit(`auth:${ip}`, 5);
        if (!rl.allowed) { response = rateLimitedResponse(rl); }
        else { response = addRateLimitHeaders(await handleVerify(request, env.DB), rl); }
      }
      else if (path === '/api/auth/verify-email') {
        const rl = checkRateLimit(`auth:${ip}`, 5);
        if (!rl.allowed) { response = rateLimitedResponse(rl); }
        else { response = addRateLimitHeaders(await handleVerifyEmail(request, env.DB), rl); }
      }

      // Galaxy routes (public reads)
      else if (path === '/api/galaxy' && method === 'GET') {
        const rl = checkRateLimit(`public:${ip}`, 60);
        if (!rl.allowed) { response = rateLimitedResponse(rl); }
        else { response = addRateLimitHeaders(await handleListGalaxies(env.DB), rl); }
      }
      else if (path.startsWith('/api/galaxy/')) {
        const rl = checkRateLimit(`public:${ip}`, 60);
        if (!rl.allowed) { response = rateLimitedResponse(rl); }
        else {
          const parts = path.split('/');
          const galaxyId = parts[3];

          if (parts[4] === 'sectors' && method === 'GET') {
            response = addRateLimitHeaders(await handleGetSectors(galaxyId, env.DB), rl);
          }
          else if (parts[4] === 'sector' && method === 'GET') {
            response = addRateLimitHeaders(await handleGetSector(galaxyId, url.searchParams.get('id'), env.DB), rl);
          }
          else if (parts.length === 4 && method === 'GET') {
            response = addRateLimitHeaders(await handleGetGalaxy(galaxyId, env.DB), rl);
          }
          else {
            response = jsonError('Not found', 404);
          }
        }
      }

      // Leaderboard (public)
      else if (path === '/api/leaderboard' && method === 'GET') {
        const rl = checkRateLimit(`public:${ip}`, 60);
        if (!rl.allowed) { response = rateLimitedResponse(rl); }
        else { response = addRateLimitHeaders(await handleLeaderboard(url.searchParams.get('galaxyId'), url.searchParams.get('limit'), url.searchParams.get('sort'), env.DB), rl); }
      }

      // News GET (public read)
      else if (path === '/api/news' && method === 'GET') {
        const rl = checkRateLimit(`public:${ip}`, 60);
        if (!rl.allowed) { response = rateLimitedResponse(rl); }
        else { response = addRateLimitHeaders(await handleGetNews(url.searchParams.get('galaxyId'), url.searchParams.get('limit'), env.DB), rl); }
      }

      // Bounty board (public read)
      else if (path === '/api/bounty/board' && method === 'GET') {
        const rl = checkRateLimit(`public:${ip}`, 60);
        if (!rl.allowed) { response = rateLimitedResponse(rl); }
        else { response = addRateLimitHeaders(await handleBountyBoard(url.searchParams.get('galaxyId'), env.DB), rl); }
      }

      // Admin/NPC routes
      else if (path === '/api/npc/llm-health' && (method === 'GET' || method === 'POST')) {
        const rl = checkRateLimit(`admin:${ip}`, 10);
        if (!rl.allowed) { response = rateLimitedResponse(rl); }
        else { response = addRateLimitHeaders(await handleNPCLLMHealth(request, env.ADMIN_SECRET, {
          ai: env.AI,
          model: env.NPC_MODEL,
          quoteModel: env.NPC_QUOTE_MODEL,
          enabled: env.NPC_LLM_ENABLED === 'true',
        }), rl); }
      }
      else if (path === '/api/npc/model-benchmark' && (method === 'GET' || method === 'POST')) {
        const rl = checkRateLimit(`admin:${ip}`, 10);
        if (!rl.allowed) { response = rateLimitedResponse(rl); }
        else { response = addRateLimitHeaders(await handleNPCModelBenchmark(request, env.ADMIN_SECRET, {
          ai: env.AI,
          model: env.NPC_MODEL,
          quoteModel: env.NPC_QUOTE_MODEL,
          enabled: env.NPC_LLM_ENABLED === 'true',
        }), rl); }
      }

      // ─── Authenticated routes ────────────────────────────
      else {
        const auth = await verifyToken(env.DB, request.headers.get('Authorization'));
        if (!auth) {
          response = jsonError('Unauthorized', 401);
        }
        // ── Auth-gated POSTs (gameplay: rate limit + action budget) ──
        else if (path === '/api/news' && method === 'POST') {
          response = await withGameplayRateLimit(auth.playerId, () => handleAddNews(auth, request, env.DB));
        }
        // ── Auth-gated GETs (reads) ──
        else if (path === '/api/player' && method === 'GET') {
          const rl = checkRateLimit(`read:${auth.playerId}`, 60);
          if (!rl.allowed) { response = rateLimitedResponse(rl); }
          else { response = addRateLimitHeaders(await handleGetPlayer(auth, env.DB), rl); }
        }
        else if (path === '/api/player/ship' && method === 'GET') {
          const rl = checkRateLimit(`read:${auth.playerId}`, 60);
          if (!rl.allowed) { response = rateLimitedResponse(rl); }
          else { response = addRateLimitHeaders(await handleGetShip(auth, url.searchParams.get('galaxyId'), env.DB), rl); }
        }
        else if (path === '/api/player/ship' && method === 'POST') {
          response = await withGameplayRateLimit(auth.playerId, () => handleCreateShip(auth, request, env.DB));
        }
        else if (path === '/api/player/ship/move' && method === 'POST') {
          response = await withGameplayRateLimit(auth.playerId, () => handleMoveShip(auth, request, env.DB));
        }
        else if (path === '/api/player/alignment' && method === 'GET') {
          const rl = checkRateLimit(`read:${auth.playerId}`, 60);
          if (!rl.allowed) { response = rateLimitedResponse(rl); }
          else { response = addRateLimitHeaders(await handleGetAlignment(auth, url.searchParams.get('galaxyId'), env.DB), rl); }
        }
        else if (path === '/api/player/pay-taxes' && method === 'POST') {
          response = await withGameplayRateLimit(auth.playerId, () => handlePayTaxes(auth, request, env.DB));
        }
        else if (path === '/api/player/commission' && method === 'POST') {
          response = await withGameplayRateLimit(auth.playerId, () => handleRequestCommission(auth, request, env.DB));
        }
        else if (path === '/api/action/trade' && method === 'POST') {
          response = await withGameplayRateLimit(auth.playerId, () => handleTrade(auth, request, env.DB));
        }
        else if (path === '/api/action/combat' && method === 'POST') {
          response = await withGameplayRateLimit(auth.playerId, () => handleCombat(auth, request, env.DB));
        }
        else if (path === '/api/action/rob' && method === 'POST') {
          response = await withGameplayRateLimit(auth.playerId, () => handleRob(auth, request, env.DB));
        }
        else if (path === '/api/action/steal' && method === 'POST') {
          response = await withGameplayRateLimit(auth.playerId, () => handleSteal(auth, request, env.DB));
        }
        else if (path === '/api/port/crime-status' && method === 'GET') {
          const rl = checkRateLimit(`read:${auth.playerId}`, 60);
          if (!rl.allowed) { response = rateLimitedResponse(rl); }
          else { response = addRateLimitHeaders(await handleCrimeStatus(auth, url.searchParams.get('galaxyId'), url.searchParams.get('sectorId'), env.DB), rl); }
        }
        else if (path === '/api/action/upgrade' && method === 'POST') {
          response = await withGameplayRateLimit(auth.playerId, () => handleUpgrade(auth, request, env.DB));
        }
        else if (path === '/api/player/stats' && method === 'GET') {
          const rl = checkRateLimit(`read:${auth.playerId}`, 60);
          if (!rl.allowed) { response = rateLimitedResponse(rl); }
          else { response = addRateLimitHeaders(await handlePlayerStats(auth, url.searchParams.get('galaxyId'), env.DB), rl); }
        }
        else if (path === '/api/bounty/status' && method === 'GET') {
          const rl = checkRateLimit(`read:${auth.playerId}`, 60);
          if (!rl.allowed) { response = rateLimitedResponse(rl); }
          else { response = addRateLimitHeaders(await handleBountyStatus(auth, env.DB), rl); }
        }
        else if (path === '/api/notifications/digest' && method === 'GET') {
          const rl = checkRateLimit(`read:${auth.playerId}`, 60);
          if (!rl.allowed) { response = rateLimitedResponse(rl); }
          else { response = addRateLimitHeaders(await handleDigest(auth, url.searchParams.get('galaxyId'), env.DB), rl); }
        }
        else if (path === '/api/insurance/buy' && method === 'POST') {
          response = await withGameplayRateLimit(auth.playerId, () => handleInsuranceBuy(auth, request, env.DB));
        }
        else if (path === '/api/insurance/status' && method === 'GET') {
          const rl = checkRateLimit(`read:${auth.playerId}`, 60);
          if (!rl.allowed) { response = rateLimitedResponse(rl); }
          else { response = addRateLimitHeaders(await handleInsuranceStatus(auth, url.searchParams.get('galaxyId'), env.DB), rl); }
        }
        else if (path === '/api/fighters/buy' && method === 'POST') {
          response = await withGameplayRateLimit(auth.playerId, () => handleBuyFighters(auth, request, env.DB));
        }
        else if (path === '/api/fighters/deploy' && method === 'POST') {
          response = await withGameplayRateLimit(auth.playerId, () => handleDeployFighters(auth, request, env.DB));
        }
        else if (path === '/api/fighters/sector' && method === 'GET') {
          const rl = checkRateLimit(`read:${auth.playerId}`, 60);
          if (!rl.allowed) { response = rateLimitedResponse(rl); }
          else { response = addRateLimitHeaders(await handleGetSectorFighters(auth, url.searchParams.get('galaxyId'), url.searchParams.get('sectorId'), env.DB), rl); }
        }
        else if (path === '/api/fighters/recall' && method === 'POST') {
          response = await withGameplayRateLimit(auth.playerId, () => handleRecallFighters(auth, request, env.DB));
        }
        else if (path === '/api/fighters/encounter/resolve' && method === 'POST') {
          response = await withGameplayRateLimit(auth.playerId, () => handleResolveEncounter(auth, request, env.DB));
        }
        // Planet routes
        else if (path === '/api/planets/create' && method === 'POST') {
          response = await withGameplayRateLimit(auth.playerId, () => handleCreatePlanet(auth, request, env.DB));
        }
        else if (path === '/api/planets/sector' && method === 'GET') {
          const rl = checkRateLimit(`read:${auth.playerId}`, 60);
          if (!rl.allowed) { response = rateLimitedResponse(rl); }
          else { response = addRateLimitHeaders(await handleGetSectorPlanets(auth, url.searchParams.get('galaxyId'), url.searchParams.get('sectorId'), env.DB), rl); }
        }
        else if (path === '/api/planets/colonize' && method === 'POST') {
          response = await withGameplayRateLimit(auth.playerId, () => handleColonize(auth, request, env.DB));
        }
        else if (path === '/api/planets/citadel/advance' && method === 'POST') {
          response = await withGameplayRateLimit(auth.playerId, () => handleAdvanceCitadel(auth, request, env.DB));
        }
        else if (path === '/api/planets/qcannon' && method === 'POST') {
          response = await withGameplayRateLimit(auth.playerId, () => handleConfigureQCannon(auth, request, env.DB));
        }
        else if (path === '/api/planets/transport' && method === 'POST') {
          response = await withGameplayRateLimit(auth.playerId, () => handlePlanetTransport(auth, request, env.DB));
        }
        else if (path === '/api/planets/citadel-costs' && method === 'GET') {
          const rl = checkRateLimit(`read:${auth.playerId}`, 60);
          if (!rl.allowed) { response = rateLimitedResponse(rl); }
          else { response = addRateLimitHeaders(await handleGetCitadelCosts(auth, url.searchParams.get('planetId') ?? '', env.DB), rl); }
        }
        else if (path.startsWith('/api/planets/') && method === 'GET') {
          const rl = checkRateLimit(`read:${auth.playerId}`, 60);
          if (!rl.allowed) { response = rateLimitedResponse(rl); }
          else {
            const planetId = path.split('/').pop()!;
            response = addRateLimitHeaders(await handleGetPlanet(auth, planetId, env.DB), rl);
          }
        }
        else if (path === '/api/mines/buy' && method === 'POST') {
          response = await withGameplayRateLimit(auth.playerId, () => handleBuyMines(auth, request, env.DB));
        }
        else if (path === '/api/mines/deploy' && method === 'POST') {
          response = await withGameplayRateLimit(auth.playerId, () => handleDeployMines(auth, request, env.DB));
        }
        else if (path === '/api/mines/sector' && method === 'GET') {
          const rl = checkRateLimit(`read:${auth.playerId}`, 60);
          if (!rl.allowed) { response = rateLimitedResponse(rl); }
          else { response = addRateLimitHeaders(await handleGetSectorMines(auth, url.searchParams.get('galaxyId'), url.searchParams.get('sectorId'), env.DB), rl); }
        }
        else if (path === '/api/mines/clear-limpets' && method === 'POST') {
          response = await withGameplayRateLimit(auth.playerId, () => handleClearLimpets(auth, request, env.DB));
        }
        else if (path === '/api/player/missions' && method === 'GET') {
          const rl = checkRateLimit(`read:${auth.playerId}`, 60);
          if (!rl.allowed) { response = rateLimitedResponse(rl); }
          else { response = addRateLimitHeaders(await handleGetMissions(auth, url.searchParams.get('galaxyId'), env.DB), rl); }
        }
        else if (path === '/api/player/missions/claim' && method === 'POST') {
          response = await withGameplayRateLimit(auth.playerId, () => handleClaimMission(auth, request, env.DB));
        }
        else if (path === '/api/player/missions/reroll' && method === 'POST') {
          response = await withGameplayRateLimit(auth.playerId, () => handleRerollMission(auth, request, env.DB));
        }
        else if (path === '/api/npc/tick' && method === 'POST') {
          const rl = checkRateLimit(`admin:${ip}`, 10);
          if (!rl.allowed) { response = rateLimitedResponse(rl); }
          else { response = addRateLimitHeaders(await handleNPCTick(request, env.DB, env.ADMIN_SECRET, {
            ai: env.AI,
            model: env.NPC_MODEL,
            quoteModel: env.NPC_QUOTE_MODEL,
            enabled: env.NPC_LLM_ENABLED === 'true',
          }), rl); }
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
    ctx.waitUntil(runNPCTick(env.DB, 1, {
      ai: env.AI,
      model: env.NPC_MODEL,
      quoteModel: env.NPC_QUOTE_MODEL,
      enabled: env.NPC_LLM_ENABLED === 'true',
    }));
    ctx.waitUntil(handleProductionTick(env.DB, 1));
    return;
  },
};
