---
title: Build a News Bot
description: Create a Discord webhook that posts galaxy news every 5 minutes
section: tutorial
order: 21
---

# Build a News Bot

> This tutorial builds a **read-only** tool. It does not perform gameplay actions and is fully compliant with the [Fair Play](/api/fair-play) policy.

## What You'll Build

A lightweight script that polls `/api/news` every 5 minutes and posts new headlines to a Discord webhook.

## Prerequisites

- A Discord server where you can create webhooks
- A galaxy ID (get it from `/api/galaxy`)

## Step 1: Create a Discord Webhook

1. In Discord, go to Server Settings → Integrations → Webhooks
2. Create a webhook for your desired channel
3. Copy the webhook URL

## Step 2: The Script

Save as `news-bot.js`:

```javascript
const API = 'https://api.playtradewars.net';
const WEBHOOK_URL = 'YOUR_DISCORD_WEBHOOK_URL';
const GALAXY_ID = 1;
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

let lastId = 0;

async function pollNews() {
  try {
    const res = await fetch(`${API}/api/news?galaxyId=${GALAXY_ID}&limit=10`);
    const data = await res.json();
    const news = data.news || [];

    const newItems = news.filter(n => n.id > lastId).reverse();
    if (newItems.length === 0) return;

    for (const item of newItems) {
      await postToDiscord(item);
      lastId = Math.max(lastId, item.id);
    }
  } catch (err) {
    console.error('Poll failed:', err.message);
  }
}

async function postToDiscord(item) {
  const emoji = {
    combat: '⚔️',
    trade: '💰',
    crime: '🚨',
    event: '📰',
  }[item.type] || '📰';

  await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: `${emoji} **${item.type.toUpperCase()}** — ${item.headline}`,
    }),
  });
}

// Run immediately, then every 5 minutes
pollNews();
setInterval(pollNews, POLL_INTERVAL_MS);
console.log('News bot running. Polling every 5 minutes.');
```

## Step 3: Run It

```bash
node news-bot.js
```

Or host it on a free service so it runs 24/7:

- **Glitch** — remix a Node.js project, paste the script
- **Replit** — create a Node.js repl, paste the script
- **Cloudflare Worker** — free tier, always-on, no server to manage

## Cloudflare Worker Version

If you want to host it serverless:

```javascript
export default {
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(pollAndPost(env.WEBHOOK_URL, env.GALAXY_ID));
  },
};

async function pollAndPost(webhookUrl, galaxyId) {
  const res = await fetch(`https://api.playtradewars.net/api/news?galaxyId=${galaxyId}&limit=5`);
  const data = await res.json();
  // ...post to webhook...
}
```

Add a Cron trigger in `wrangler.toml`:

```toml
[triggers]
crons = ["*/5 * * * *"]
```

## Filtering

Only want combat news? Filter by type before posting:

```javascript
const COMBAT_TYPES = ['combat', 'crime'];
const newItems = news
  .filter(n => n.id > lastId)
  .filter(n => COMBAT_TYPES.includes(n.type))
  .reverse();
```

## That's It

Your corp will never miss a kill, a trade deal, or a port robbery again.
