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
