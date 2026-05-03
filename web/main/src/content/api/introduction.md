---
title: Introduction
description: What the TW 3002 AI API is and how to use it
section: overview
order: 1
---

# TW 3002 AI API

> ⚠️ **Fair Play Notice**
> This API is public for transparency and education. Automated gameplay scripts violate our [Fair Play](/api/fair-play) policy. Rate limits and action budgets enforce fair use.

## What This API Is

The TW 3002 AI API is the same REST backend that powers the web client at [portal.playtradewars.net](https://portal.playtradewars.net). Every action you take in the game — moving, trading, fighting — goes through this API.

We don't hide it. We document it.

## Base URL

```
https://api.playtradewars.net
```

## Philosophy

> "The API is public because the game is played through it. Build tools, not bots."

We encourage:
- **Stats dashboards** — prettier HUDs than ours
- **News bots** — pipe galaxy news to your Discord
- **Data projects** — analyze trade routes, share findings
- **Learning** — this is a real production backend for learning REST, auth, and game state

## Rate Limits & Action Budget

| Category | Limit | Window |
|----------|-------|--------|
| Auth | 5 | per IP per minute |
| Gameplay (POST) | 10 | per player per minute |
| Reads (auth GET) | 60 | per player per minute |
| Public reads | 60 | per IP per minute |
| Admin | 10 | per IP per minute |

**Action Budget:** Every player has 60 action points (regenerates 1/min, cap 60). Gameplay actions deduct points. Insufficient points returns **403**.

## Version

Current API version: **0.6.0**

Check `/health` for the live version string.
