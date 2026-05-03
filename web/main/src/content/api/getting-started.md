---
title: Getting Started
description: Your first API request, response format, and rate limit headers
section: overview
order: 2
---

# Getting Started

## First Request

No auth required — just hit the health endpoint:

```bash
curl https://api.playtradewars.net/health
```

Response:

```json
{
  "status": "ok",
  "version": "0.6.0"
}
```

## Response Format

Every response is JSON. The API uses two top-level shapes:

**Success:**
```json
{
  "success": true,
  ...data
}
```

**Error:**
```json
{
  "error": "human-readable message"
}
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 400 | Bad request (missing/invalid params) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient action points, not in sector, etc.) |
| 404 | Not found |
| 405 | Method not allowed |
| 409 | Conflict (fighter encounter required) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

## Rate Limit Headers

Every response includes rate limit headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1717342800
```

If you hit a limit, you get **429** with a `Retry-After` header:

```
Retry-After: 45
```

## Action Budget Headers

Gameplay responses include action point headers:

```
X-ActionPoints-Remaining: 47
```

If you're out of points:

```
X-ActionPoints-Remaining: 0
X-ActionPoints-NextRefill: 5
```

## Next Steps

- [Authentication](/api/authentication) — register and get a bearer token
- [Endpoint Reference](/api/reference) — browse all 42 endpoints interactively
