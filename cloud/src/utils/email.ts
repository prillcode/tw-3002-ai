import { DISPOSABLE_DOMAINS } from './disposable-domains.js';

/** Validate basic email structure. */
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1];
  if (domain.length < 4) return false;
  if (email.length > 254) return false;
  return true;
}

/** Check if domain is a known disposable/throwaway email provider. */
export function isDisposableDomain(domain: string): boolean {
  return DISPOSABLE_DOMAINS.has(domain.toLowerCase());
}

/** SHA-256 hash of a string (hex). */
export async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Generate a 6-digit OTP. */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Send verification email via Resend. Falls back to console in dev. */
export async function sendVerificationEmail(
  apiKey: string | undefined,
  to: string,
  otp: string,
): Promise<{ success: boolean; error?: string }> {
  if (!apiKey) {
    console.log(`[DEV] Verification code for ${to}: ${otp}`);
    return { success: true };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'TW 3002 AI <welcome@playtradewars.net>',
      to,
      subject: 'Your verification code for TW 3002 AI',
      html: `<p>Your verification code is:</p><h1 style="font-size:2rem;letter-spacing:0.2rem;">${otp}</h1><p>This code expires in 15 minutes.</p><p>If you didn't request this, ignore this email.</p>`,
      text: `Your verification code is: ${otp}\nThis code expires in 15 minutes.\nIf you didn't request this, ignore this email.`,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Resend error:', err);
    return { success: false, error: err };
  }
  return { success: true };
}

/** Verify a Cloudflare Turnstile token. */
export async function verifyTurnstile(
  secret: string | undefined,
  token: string | undefined,
): Promise<{ success: boolean }> {
  if (!secret) {
    // Turnstile not configured — allow through (dev mode)
    return { success: true };
  }
  if (!token) {
    return { success: false };
  }

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, response: token }),
  });

  const data = (await res.json()) as { success: boolean };
  return { success: data.success };
}
