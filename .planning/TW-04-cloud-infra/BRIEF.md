# TW-04: Cloud Infrastructure & Distribution

## Work Identity
- **ID:** TW-04
- **Type:** Feature
- **Scope:** Cloud Deployment, Auth, Web Client, Packaging

## Objective
Bring TW 3002 AI to the world: Cloudflare Workers + D1 for shared galaxies, email-based auth, optional web client, and CLI distribution via npm/brew. Make it easy for players to install and share.

## In Scope
- **Versioned SQLite schema migrations** (local CLI — prevents "old save" breakage)
- Cloudflare Workers API (REST endpoints)
- Cloudflare D1 database (uses D1 native `wrangler d1 migrations`)
- Email token authentication (magic links)
- Admin panel web interface (galaxy management, reset config)
- Web client (secondary, simplified UI)
- CLI binary distribution (npm, brew)
- Docker home hosting option
- Cost monitoring and rate limiting
- GitHub Actions CI/CD

## Out of Scope
- Real-time WebSocket multiplayer
- Complex OAuth (Google/GitHub login)
- Mobile native apps
- Paid tier / monetization
- Enterprise features

## Success Criteria
1. Schema migrations are versioned, tested, and reversible
2. Player can register with email, get magic link
3. CLI connects to cloud API: `tw3002 play --galaxy public-1`
4. Galaxy state persists in D1, shared across players
5. Admin can configure galaxy reset schedules
6. Web client works in browser (fallback experience)
7. CLI installable: `npm install -g tw3002`
8. Home Docker: `docker run -p 8080:8080 tw3002`
9. Costs stay on Cloudflare free tier at hobby scale

## Dependencies
- Blocked by: TW-01, TW-02, TW-03 (need complete game to deploy)
- Blocks: None (capstone work item)
- Related: All previous work items

## References
- PRD: `docs/TW3002-PRD.md` Sections 3 (Architecture), 6 (Hosting)
- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Cloudflare D1: https://developers.cloudflare.com/d1/
