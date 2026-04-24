import type { D1Database } from '@cloudflare/workers-types';

export interface AuthContext {
  playerId: number;
  email: string;
}

/**
 * Verify a Bearer token and return the authenticated player.
 * Tokens are opaque strings stored in the players table.
 */
export async function verifyToken(
  db: D1Database,
  authHeader: string | null
): Promise<AuthContext | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  if (!token) return null;

  const row = await db
    .prepare(
      'SELECT id, email FROM players WHERE auth_token = ? AND (token_expires_at IS NULL OR token_expires_at > datetime("now"))'
    )
    .bind(token)
    .first<{ id: number; email: string }>();

  if (!row) return null;

  return { playerId: row.id, email: row.email };
}
