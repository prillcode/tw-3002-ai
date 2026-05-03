---
title: Fair Play
description: Rules and philosophy for using the TW 3002 AI API
section: overview
order: 4
---

# Fair Play

## The API Is Public On Purpose

The TW 3002 AI API is public because the web client at [portal.playtradewars.net](https://portal.playtradewars.net) uses it for every action. You can see every request in your browser's DevTools. We don't hide the API — we document it.

## Why Limits Exist

The galaxy is shared. If one player runs a script that makes 1,000 trades per minute, everyone else's experience degrades. Rate limits and action budgets aren't anti-developer — they're pro-fairness.

## Action Budget: The Great Equalizer

Every player gets 60 action points per hour. Moving, trading, fighting — they all cost points. A script can't do *more* than a human. It can only optimize what's available.

## What's Encouraged

✅ **Stats Dashboards** — Track your own progress. Build a prettier HUD than ours.

✅ **News Bots** — Pipe galaxy news to your Discord server. Keep your corp informed.

✅ **Data Projects** — Analyze trade routes, price histories, NPC patterns. Share your findings.

✅ **Learning** — This API is a real production backend. Use it to learn REST, auth, rate limiting, and game state management.

## What's Not Allowed

❌ **Auto-Traders** — Scripts that buy and sell without you clicking a button.

❌ **Auto-Combat** — Scripts that attack NPCs or players automatically.

❌ **Route Optimizers with Execution** — Calculating the best route is fine. Flying it for you is not.

❌ **Real-Time Feeds** — Broadcasting live sector data to give players an unfair map advantage.

## Enforcement

- **Soft limits:** Rate throttling (429 responses)
- **Action limits:** 60 points/hour max
- **Hard limits:** Persistent botting may result in account suspension

Violations may also result in account termination under our [Terms of Service](/api/terms).

## We Trust You

TradeWars was always a game of strategy, not reflexes. A bot can't negotiate a truce, plan a blockade, or bluff in PvP. Build cool tools. Don't build tools that play the game for you.
