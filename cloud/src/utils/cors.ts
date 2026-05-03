import type { RateLimitResult } from './rateLimit.js';
import type { ActionBudgetResult } from './actionBudget.js';

/**
 * CORS headers for all API responses.
 */
export const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Secret',
};

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

export function jsonError(message: string, status = 400): Response {
  return json({ error: message }, status);
}

// ─── Rate limit / action budget response helpers ────────────────

export function rateLimitedResponse(rl: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: `Rate limit exceeded. Retry in ${rl.retryAfter}s.`,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Retry-After': String(rl.retryAfter),
        'X-RateLimit-Limit': String(rl.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(rl.reset),
      },
    },
  );
}

export function actionBudgetExceededResponse(budget: ActionBudgetResult): Response {
  return new Response(
    JSON.stringify({
      error: `Insufficient action points. Refills in ${budget.nextRefillMinutes} minute${budget.nextRefillMinutes === 1 ? '' : 's'}.`,
    }),
    {
      status: 403,
      headers: {
        ...corsHeaders,
        'X-ActionPoints-Remaining': String(budget.remaining),
        'X-ActionPoints-NextRefill': String(budget.nextRefillMinutes),
      },
    },
  );
}

/** Add rate limit headers to an existing response. */
export function addRateLimitHeaders(
  response: Response,
  rl: RateLimitResult,
): Response {
  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Limit', String(rl.limit));
  headers.set('X-RateLimit-Remaining', String(rl.remaining));
  headers.set('X-RateLimit-Reset', String(rl.reset));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

const ALLOWED_ORIGINS = [
  'https://playtradewars.net',
  'https://portal.playtradewars.net',
  'http://localhost:4321',
  'http://localhost:5173',
];

/**
 * Apply origin-restricted CORS to any response.
 * Call this at the top level before returning.
 */
export function applyCors(response: Response, request: Request): Response {
  const origin = request.headers.get('Origin') || '';
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : '*';

  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', allowOrigin);
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Secret');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
