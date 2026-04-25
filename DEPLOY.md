# TW 3002 AI — Deployment Guide

This guide covers deploying the web properties to Cloudflare Pages and configuring custom domains.

## Prerequisites

1. **Cloudflare account** with `playtradewars.net` added as a zone
2. **Wrangler CLI** installed and authenticated: `npx wrangler login`
3. **pnpm** (or npm) installed locally

## Domain Setup

### Step 1: Ensure Domain is on Cloudflare

Your domain `playtradewars.net` must use Cloudflare nameservers. Check in your Cloudflare dashboard under **Websites → playtradewars.net → Overview**. If you see "Pending nameserver update," follow the instructions to change nameservers at your registrar.

### Step 2: DNS Records (Auto-Created by Pages)

When you add custom domains in Cloudflare Pages, it creates these records automatically:

```
playtradewars.net     CNAME  <pages-project>.pages.dev
portal                CNAME  <game-project>.pages.dev
```

No manual DNS entry needed if the domain is on Cloudflare.

---

## Deploy the Marketing + Docs Site (`web/main`)

### Option A: Git Integration (Recommended)

1. Push your repo to GitHub
2. In Cloudflare dashboard, go to **Workers & Pages → Create → Pages**
3. Connect your GitHub repo
4. Configure:
   - **Project name:** `tw3002-main`
   - **Production branch:** `main`
   - **Build command:** `cd web/main && pnpm install && pnpm run build`
   - **Build output directory:** `web/main/dist`
5. Add environment variable:
   - `NODE_VERSION = 20`
6. Click **Save and Deploy**
7. After first deploy, go to **Custom domains** and add `playtradewars.net`
8. Cloudflare will auto-create the DNS record

### Option B: Wrangler CLI

```bash
cd web/main
pnpm install
pnpm run build
npx wrangler pages deploy dist --project-name=tw3002-main
```

Then in the dashboard, add `playtradewars.net` as a custom domain.

---

## Deploy the Game Client (`web/game`)

### Option A: Git Integration (Recommended)

Same process as above, but:

- **Project name:** `tw3002-game`
- **Build command:** `cd web/game && pnpm install && pnpm run build`
- **Build output directory:** `web/game/dist`
- **Custom domain:** `portal.playtradewars.net`

### Option B: Wrangler CLI

```bash
cd web/game
pnpm install
pnpm run build
npx wrangler pages deploy dist --project-name=tw3002-game
```

---

## Deploy the API Worker (`cloud/`)

The Worker is already deployed. To add the custom domain:

```bash
cd cloud
npx wrangler deploy
```

Then in the Cloudflare dashboard:
1. Go to **Workers & Pages → tw3002-api → Settings → Triggers**
2. Click **Add Custom Domain**
3. Enter `api.playtradewars.net`
4. Cloudflare auto-creates the DNS record

Or via Wrangler:

```bash
cd cloud
npx wrangler route add "api.playtradewars.net/*"
```

---

## Verify Everything Works

After all three are deployed:

```bash
# Marketing site
curl -s https://playtradewars.net | head -20

# Game client
curl -s https://portal.playtradewars.net | head -20

# API
curl -s https://api.playtradewars.net/health
```

Then open `https://portal.playtradewars.net` in a browser and test the auth flow end-to-end.

---

## Troubleshooting

### "Failed to fetch" in game client

Check browser devtools Network tab. If CORS errors:
- Verify the API Worker deployed with the updated `cors.ts`
- Check that `api.playtradewars.net` is in the `ALLOWED_ORIGINS` array

### Styles not loading on main site

- Ensure `global.css` is imported in `Layout.astro`
- Check `dist/_astro/` has CSS files after build

### Custom domain shows 404

- DNS propagation can take a few minutes
- In Pages dashboard, check the custom domain status — it may need SSL certificate provisioning
