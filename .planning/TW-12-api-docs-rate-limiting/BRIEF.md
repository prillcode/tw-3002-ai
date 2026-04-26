# TW-12: API Docs & Rate Limiting

## Work Identity
- **ID:** TW-12
- **Type:** Enhancement
- **Scope:** Public API documentation on Astro site + Cloudflare Worker rate limiting

## Objective
Document the public game API for educational purposes while implementing rate limits to prevent automated play from creating unfair advantages.

## In Scope
- **Astro `/api/` content collection** — overview, getting-started, auth, endpoint reference, tutorials
- **Rate limiting in Cloudflare Worker** — per-endpoint limits, action budget system
- **Fair Play page** — explain why limits exist, what's allowed vs not allowed
- **Terms of Service stub** — basic rules about automated play

## Out of Scope
- Complex bot detection (heuristics, CAPTCHA)
- IP banning system
- OAuth or API key system
- HMAC signed requests (defer to later if needed)

## Success Criteria
1. `playtradewars.net/api/` has complete docs with request/response examples
2. Rate limits return 429 with Retry-After headers
3. Action budget system limits players to ~60 actions/hour
4. Fair Play page explains the philosophy
5. All docs match actual API behavior
