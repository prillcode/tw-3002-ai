/**
 * In-memory rate limiting for Cloudflare Workers.
 *
 * Uses a per-worker Map with minute-long sliding windows.
 * Data resets on cold start (acceptable for short windows).
 */

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp (seconds) when window resets
  retryAfter?: number; // Seconds until next request allowed (only when !allowed)
}

interface RateLimitEntry {
  count: number;
  windowStart: number; // Unix timestamp ms
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const WINDOW_MS = 60_000; // 1 minute

export function checkRateLimit(
  key: string,
  maxRequests: number,
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  // No entry or window expired → fresh window
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return {
      allowed: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      reset: Math.floor((now + WINDOW_MS) / 1000),
    };
  }

  // Within window, over limit
  if (entry.count >= maxRequests) {
    const retryAfter = Math.ceil(
      (entry.windowStart + WINDOW_MS - now) / 1000,
    );
    return {
      allowed: false,
      limit: maxRequests,
      remaining: 0,
      reset: Math.floor((entry.windowStart + WINDOW_MS) / 1000),
      retryAfter,
    };
  }

  // Within window, under limit
  entry.count++;
  return {
    allowed: true,
    limit: maxRequests,
    remaining: maxRequests - entry.count,
    reset: Math.floor((entry.windowStart + WINDOW_MS) / 1000),
  };
}

/**
 * Extract client IP from Cloudflare headers.
 */
export function getClientIP(request: Request): string {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    '127.0.0.1'
  );
}
