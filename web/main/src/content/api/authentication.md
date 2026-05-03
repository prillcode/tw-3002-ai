---
title: Authentication
description: Register, verify with OTP, and use bearer tokens
section: overview
order: 3
---

# Authentication

TW 3002 AI uses email verification with a 6-digit OTP code. No passwords.

## Step 1: Register

```bash
curl -X POST https://api.playtradewars.net/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "turnstileToken": "..."}'
```

Response:

```json
{
  "success": true,
  "message": "Check your email for a verification code"
}
```

A 6-digit code is sent to your email. In development, the code is logged to the server console.

> **Turnstile:** The web client includes a Cloudflare Turnstile widget. If Turnstile is not configured server-side, the token is optional.
> **Disposable emails:** Addresses from throwaway domains (e.g. 10minutemail.com) are rejected.

## Step 2: Verify Email

```bash
curl -X POST https://api.playtradewars.net/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "otp": "123456"}'
```

Response:

```json
{
  "success": true,
  "authToken": "550e8400-e29b-41d4-a716-446655440000",
  "expiresAt": "2024-06-15T12:00:00Z"
}
```

The `authToken` is your **bearer token**. Save it.

## Step 3: Use Bearer Token

```bash
curl https://api.playtradewars.net/api/player \
  -H "Authorization: Bearer 550e8400-e29b-41d4-a716-446655440000"
```

## Token Expiry

Tokens expire after **7 days**. There is no refresh mechanism — re-register with the same email to get a new code.

## Email Verification Required

You must verify your email before creating a ship. Attempting `POST /api/player/ship` without verification returns:

```json
{
  "error": "Email verification required. Please verify your email before creating a ship."
}
```

## No Passwords

We don't store passwords. The OTP is short-lived (15 minutes) and delivered to your email. If you lose your token, just re-register.
