# TW-11 — Email & Player Polish

## Objective
Add email verification, player subscription capture, and anti-spam protections to the auth system. Convert the silent email-as-username flow into a proper player onboarding and retention pipeline.

## Context
Currently the auth system at `POST /api/auth/register` accepts any email string, generates a bearer token immediately, and stores the record in D1. No email is sent, no verification happens, and there are no anti-spam protections. The `players` table already captures every email entered, making it a de-facto subscriber list, but it lacks validation, deduplication signals, and opt-in consent tracking.

## Scope

### In Scope
- Email verification flow (magic link or OTP code)
- Disposable/throwaway email domain blocklist
- Rate limiting on auth endpoints (register, verify)
- Cloudflare Turnstile (invisible CAPTCHA) on the login form
- Player subscription/consent tracking (opt-in flag, marketing consent)
- Admin endpoint to export player emails for newsletters
- Resend or SendGrid integration for transactional emails

### Out of Scope
- In-app messaging or push notifications
- Marketing automation (drip campaigns, segmentation)
- Password reset flow (we use magic links, not passwords)
- OAuth/social login (Google, Discord, etc.)

## Success Criteria
- New registrations require a verified email before a ship can be created
- Disposable email domains are rejected at registration
- Bots cannot mass-register accounts
- Admin can export a clean CSV of opted-in player emails
- Email delivery rate >95% (DKIM/SPF configured)

## Relevant Files
- [`cloud/src/routes/auth.ts`](../../../cloud/src/routes/auth.ts)
- [`cloud/migrations/0001_init.sql`](../../../cloud/migrations/0001_init.sql)
- [`cloud/src/utils/cors.ts`](../../../cloud/src/utils/cors.ts)
- [`web/game/src/views/LoginView.vue`](../../../web/game/src/views/LoginView.vue)
- [`web/game/src/stores/auth.ts`](../../../web/game/src/stores/auth.ts)
