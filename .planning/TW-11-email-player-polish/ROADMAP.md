# TW-11 — Email & Player Polish Roadmap

## Phase 01 — Anti-Spam Foundation
Add protections before enabling email verification, so verified accounts are worth keeping.

- [ ] 01-01: Add Cloudflare Rate Limiting rule on `/api/auth/register`
- [ ] 01-02: Add disposable email domain blocklist to Worker register handler
- [ ] 01-03: Add basic email format validation (regex + MX lookup optional)
- [ ] 01-04: Track registration attempts per IP in D1 (abuse signal)
- [ ] 01-05: Add Turnstile widget to Vue login form

## Phase 02 — Email Verification Flow
Implement magic-link or OTP-based email verification.

- [ ] 02-01: Add `email_verified` and `verification_token` columns to `players` table
- [ ] 02-02: Update register endpoint to create unverified player + send verification email
- [ ] 02-03: Create `POST /api/auth/verify-email` endpoint (token validation)
- [ ] 02-04: Integrate Resend (or SendGrid) for transactional emails
- [ ] 02-05: Update Vue login flow to show "check your email" state
- [ ] 02-06: Prevent ship creation until email is verified

## Phase 03 — Subscriber & Player Management
Treat the player base as a subscriber list with consent tracking.

- [ ] 03-01: Add `marketing_consent` and `unsubscribed_at` columns to `players`
- [ ] 03-02: Add consent checkbox to registration UI
- [ ] 03-03: Create `POST /api/player/preferences` endpoint (opt-in/out)
- [ ] 03-04: Create admin-only `GET /api/admin/players/export` endpoint (CSV/JSON)
- [ ] 03-05: Add unsubscribe link to any future marketing emails

## Phase 04 — Email Infrastructure Polish
Ensure deliverability and monitoring.

- [ ] 04-01: Configure DKIM/SPF for `playtradewars.net` sending domain
- [ ] 04-02: Set up Resend webhook for delivery/failure/bounce tracking
- [ ] 04-03: Add email templates (verification, welcome, newsletter)
- [ ] 04-04: Monitor sender reputation and bounce rates
- [ ] 04-05: Add retry logic for failed email sends
