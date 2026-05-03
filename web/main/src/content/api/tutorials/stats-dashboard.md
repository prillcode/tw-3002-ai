---
title: Build a Stats Dashboard
description: Create a read-only HTML dashboard with ship stats and galaxy news
section: tutorial
order: 20
---

# Build a Stats Dashboard

> This tutorial builds a **read-only** tool. It does not perform gameplay actions and is fully compliant with the [Fair Play](/api/fair-play) policy.

## What You'll Build

A simple HTML dashboard that shows:
- Current ship stats (hull, shield, credits, cargo)
- Recent galaxy news
- Net worth over time (stored in localStorage)

## Prerequisites

- A registered TW 3002 AI account
- Your bearer token from `/api/auth/verify`
- A galaxy ID (get it from `/api/galaxy`)

## Step 1: Basic HTML Shell

```html
<!DOCTYPE html>
<html>
<head>
  <title>My TW 3002 Dashboard</title>
  <style>
    body { font-family: monospace; background: #0a0a0f; color: #e0e0e0; padding: 2rem; }
    .card { border: 1px solid #252a3d; border-radius: 8px; padding: 1rem; margin: 1rem 0; }
    .stat { display: flex; justify-content: space-between; padding: 0.5rem 0; }
    .label { color: #6b7280; }
    .value { color: #00e5ff; font-weight: bold; }
  </style>
</head>
<body>
  <h1>🌌 TW 3002 Dashboard</h1>
  <div id="ship" class="card">Loading ship...</div>
  <div id="news" class="card">Loading news...</div>

  <script>
    const API = 'https://api.playtradewars.net';
    const TOKEN = 'your-bearer-token-here';
    const GALAXY_ID = 1;

    async function api(path) {
      const res = await fetch(API + path, {
        headers: { 'Authorization': 'Bearer ' + TOKEN }
      });
      return res.json();
    }

    async function loadShip() {
      const data = await api(`/api/player/ship?galaxyId=${GALAXY_ID}`);
      const ship = data.ship;
      document.getElementById('ship').innerHTML = `
        <h2>${ship.ship_name}</h2>
        <div class="stat"><span class="label">Hull</span><span class="value">${ship.hull}</span></div>
        <div class="stat"><span class="label">Shield</span><span class="value">${ship.shield}</span></div>
        <div class="stat"><span class="label">Credits</span><span class="value">${ship.credits.toLocaleString()}</span></div>
        <div class="stat"><span class="label">Sector</span><span class="value">${ship.current_sector}</span></div>
        <div class="stat"><span class="label">Turns</span><span class="value">${ship.turns}/${ship.max_turns}</span></div>
      `;
    }

    async function loadNews() {
      const data = await api(`/api/news?galaxyId=${GALAXY_ID}&limit=5`);
      const items = data.news.map(n => `<p><strong>${n.type}</strong>: ${n.headline}</p>`).join('');
      document.getElementById('news').innerHTML = '<h2>Recent News</h2>' + items;
    }

    loadShip();
    loadNews();
    setInterval(loadNews, 30000); // Refresh news every 30s
  </script>
</body>
</html>
```

## Step 2: Deploy

Save as `index.html` and open it in your browser. No server needed.

For hosting:
- **GitHub Pages** — push to a repo, enable Pages
- **Vercel** — drag and drop the HTML file
- **Netlify** — same, drag and drop

## Step 3: Add Net Worth History (Optional)

Track net worth over time in localStorage:

```javascript
function trackNetWorth(ship) {
  const history = JSON.parse(localStorage.getItem('nw-history') || '[]');
  history.push({ t: Date.now(), v: ship.net_worth });
  localStorage.setItem('nw-history', JSON.stringify(history.slice(-50)));
}
```

Use a simple canvas chart or a library like Chart.js to visualize.

## Full Code

The complete source is a single HTML file under 100 lines. No build step, no framework, no server.
