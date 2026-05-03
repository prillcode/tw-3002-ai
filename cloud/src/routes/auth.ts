import type { D1Database } from '@cloudflare/workers-types';
import { json, jsonError } from '../utils/cors.js';
import {
  isValidEmail,
  isDisposableDomain,
  sha256,
  generateOTP,
  sendVerificationEmail,
  verifyTurnstile,
} from '../utils/email.js';

interface AuthEnv {
  DB: D1Database;
  RESEND_API_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
}

/**
 * POST /api/auth/register
 * Body: { email: string, turnstileToken?: string }
 * Creates an unverified player and sends a 6-digit OTP via email.
 */
export async function handleRegister(
  request: Request,
  env: AuthEnv,
): Promise<Response> {
  if (request.method !== 'POST') return jsonError('Method not allowed', 405);

  let body: { email?: string; turnstileToken?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !isValidEmail(email)) {
    return jsonError('Valid email required', 400);
  }

  const domain = email.split('@')[1];
  if (isDisposableDomain(domain)) {
    return jsonError('Disposable email addresses are not allowed', 400);
  }

  // Verify Turnstile token
  const turnstileOk = await verifyTurnstile(env.TURNSTILE_SECRET_KEY, body.turnstileToken);
  if (!turnstileOk.success) {
    return jsonError('Turnstile verification failed', 400);
  }

  // Generate OTP
  const otp = generateOTP();
  const otpHash = await sha256(otp);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min

  const db = env.DB;

  // Upsert player (unverified)
  const existing = await db
    .prepare('SELECT id FROM players WHERE email = ?')
    .bind(email)
    .first<{ id: number }>();

  if (existing) {
    await db
      .prepare(
        'UPDATE players SET verification_token = ?, verification_expires_at = ?, verification_attempts = 0, email_verified = 0, auth_token = NULL, token_expires_at = NULL WHERE id = ?',
      )
      .bind(otpHash, expiresAt, existing.id)
      .run();
  } else {
    await db
      .prepare(
        'INSERT INTO players (email, verification_token, verification_expires_at, email_verified, created_at) VALUES (?, ?, ?, 0, datetime("now"))',
      )
      .bind(email, otpHash, expiresAt)
      .run();
  }

  // Send email (or log in dev)
  const emailResult = await sendVerificationEmail(env.RESEND_API_KEY, email, otp);
  if (!emailResult.success) {
    console.error('Failed to send verification email:', emailResult.error);
    // Don't fail the request — user can re-register to get a new code
  }

  return json({
    success: true,
    message: 'Check your email for a verification code',
  });
}

/**
 * POST /api/auth/verify-email
 * Body: { email: string, otp: string }
 * Validates OTP and returns a bearer token.
 */
export async function handleVerifyEmail(
  request: Request,
  db: D1Database,
): Promise<Response> {
  if (request.method !== 'POST') return jsonError('Method not allowed', 405);

  let body: { email?: string; otp?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const { email, otp } = body;
  if (!email || !otp) {
    return jsonError('email and otp required', 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const player = await db
    .prepare(
      'SELECT id, email_verified, verification_token, verification_expires_at, verification_attempts FROM players WHERE email = ?',
    )
    .bind(normalizedEmail)
    .first<{
      id: number;
      email_verified: number;
      verification_token: string | null;
      verification_expires_at: string | null;
      verification_attempts: number;
    }>();

  if (!player) {
    return jsonError('Invalid email', 401);
  }

  if (player.verification_attempts >= 5) {
    return jsonError('Too many attempts. Request a new code.', 429);
  }

  // Increment attempts
  await db
    .prepare('UPDATE players SET verification_attempts = verification_attempts + 1 WHERE id = ?')
    .bind(player.id)
    .run();

  // Check expiry
  if (
    player.verification_expires_at &&
    new Date(player.verification_expires_at) < new Date()
  ) {
    return jsonError('Verification code expired', 401);
  }

  // Check OTP hash
  const otpHash = await sha256(otp);
  if (player.verification_token !== otpHash) {
    return jsonError('Invalid verification code', 401);
  }

  // Success — generate bearer token
  const authToken = crypto.randomUUID();
  const tokenExpiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  await db
    .prepare(
      'UPDATE players SET email_verified = 1, auth_token = ?, token_expires_at = ?, verification_token = NULL, verification_expires_at = NULL, verification_attempts = 0, last_login_at = datetime("now") WHERE id = ?',
    )
    .bind(authToken, tokenExpiresAt, player.id)
    .run();

  return json({
    success: true,
    authToken,
    expiresAt: tokenExpiresAt,
  });
}

/**
 * POST /api/auth/verify
 * Legacy: validate an existing bearer token.
 * Now also checks email_verified.
 */
export async function handleVerify(
  request: Request,
  db: D1Database,
): Promise<Response> {
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
      'SELECT id, email, display_name, email_verified FROM players WHERE auth_token = ? AND (token_expires_at IS NULL OR token_expires_at > datetime("now"))',
    )
    .bind(token)
    .first<{
      id: number;
      email: string;
      display_name: string | null;
      email_verified: number;
    }>();

  if (!row) return jsonError('Invalid or expired token', 401);
  if (!row.email_verified) {
    return jsonError('Email verification required', 403);
  }

  return json({
    valid: true,
    playerId: row.id,
    email: row.email,
    displayName: row.display_name,
  });
}
