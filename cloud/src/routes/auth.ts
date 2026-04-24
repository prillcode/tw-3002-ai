import type { D1Database } from '@cloudflare/workers-types';
import { json, jsonError } from '../utils/cors.js';

/**
 * POST /api/auth/register
 * Body: { email: string }
 * Returns a token immediately (magic link email TBD in Phase 4).
 */
export async function handleRegister(request: Request, db: D1Database): Promise<Response> {
  if (request.method !== 'POST') return jsonError('Method not allowed', 405);

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return jsonError('Valid email required');
  }

  // Generate a simple opaque token
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  try {
    // Upsert player (insert or update token)
    const existing = await db
      .prepare('SELECT id FROM players WHERE email = ?')
      .bind(email)
      .first<{ id: number }>();

    if (existing) {
      await db
        .prepare('UPDATE players SET auth_token = ?, token_expires_at = ?, last_login_at = datetime("now") WHERE id = ?')
        .bind(token, expiresAt, existing.id)
        .run();

      return json({ token, email, message: 'Login token refreshed' });
    }

    await db
      .prepare(
        'INSERT INTO players (email, auth_token, token_expires_at, last_login_at) VALUES (?, ?, ?, datetime("now"))'
      )
      .bind(email, token, expiresAt)
      .run();

    return json({ token, email, message: 'Account created' });
  } catch (err) {
    console.error('Auth register error:', err);
    return jsonError('Database error', 500);
  }
}

/**
 * POST /api/auth/verify
 * Body: { token: string }
 * Validates a token and returns player info.
 */
export async function handleVerify(request: Request, db: D1Database): Promise<Response> {
  if (request.method !== 'POST') return jsonError('Method not allowed', 405);

  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const token = body.token;
  if (!token) return jsonError('Token required');

  const row = await db
    .prepare(
      'SELECT id, email, display_name FROM players WHERE auth_token = ? AND (token_expires_at IS NULL OR token_expires_at > datetime("now"))'
    )
    .bind(token)
    .first<{ id: number; email: string; display_name: string | null }>();

  if (!row) return jsonError('Invalid or expired token', 401);

  return json({ valid: true, playerId: row.id, email: row.email, displayName: row.display_name });
}
