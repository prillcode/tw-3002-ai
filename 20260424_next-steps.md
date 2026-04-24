# Next Steps — TW 3002 AI

*Dated: 2026-04-24*

Current version: **CLI v0.6.0** | Cloud API v0.1.0 live at `tw3002-api.prilldev.workers.dev`

---

## CLI Client (`/cli`)

### Priority 1: Wire Cloud Mode Game Loop
**Status:** Login screen works, gameplay is still local-only.

The `CloudLoginScreen` authenticates and stores the Bearer token, but `SectorScreen` still uses local `galaxy` state. After cloud login, the player should:

1. Fetch galaxy sectors from `GET /api/galaxy/1/sectors`
2. Convert API response to local `Galaxy` format (Map + connections)
3. Create/join a ship via `POST /api/player/ship`
4. Render sector view with cloud-fetched data
5. Wire jump to `POST /api/player/ship/move`
6. Wire trade to `POST /api/action/trade`
7. Wire combat to `POST /api/action/combat`

**Open question:** Should this reuse `SectorScreen` with a `mode: 'local' | 'cloud'` prop, or create a separate `CloudSectorScreen`? The latter is cleaner — no branching logic in the existing screen.

**Effort:** 4–6 hours

---

### Priority 2: npm Publish
**Status:** `package.json` is ready (`bin`, `files`, `keywords`, `license`, `repository`).

1. Run `npm pack` to verify tarball contents
2. Test install: `npm install -g ./tw3002-0.6.0.tgz`
3. Run `npm publish` (or `bun publish`)
4. Update README with `npm install -g tw3002` as primary install method
5. Test GitHub Actions release workflow by pushing `git tag v0.6.0 && git push origin v0.6.0`

**Blocker:** None. Could do this today.

**Effort:** 30 minutes

---

### Priority 3: Turn Regeneration Polish
**Status:** Regeneration works on load, but no in-game visibility.

- Show idle time and regeneration rate on the sector status bar
- Add a "Time until next turn" indicator when turns < maxTurns
- Consider a `POST /api/player/ship/tick` cloud equivalent

**Effort:** 1–2 hours

---

### Priority 4: Settings Expansion
**Status:** Settings screen has "Delete All Saves" only.

Add:
- Toggle auto-save on/off
- Cloud account info (show logged-in email, logout)
- LLM config viewer (read-only display of `~/.tw3002/config.json`)

**Effort:** 2–3 hours

---

## Cloud API (`/cloud`)

### Priority 1: NPC Tick Endpoint
**Status:** NPCs are seeded at fixed positions. No evolution.

Create `POST /api/npc/tick` (or a scheduled Worker trigger) that:
1. Reads all active NPCs in a galaxy
2. For each NPC: decide action (move, trade, attack) based on persona + surroundings
3. Update `npcs` table with new positions, credits, cargo
4. Insert news items for significant events (kills, trades, sector captures)
5. Runs on a schedule (cron every 5 minutes, or triggered by player actions)

**Challenge:** The engine's `tickNPCs()` can't run in the Worker. Options:
- **Option A:** Rewrite a lightweight rule-based tick in the Worker (no LLM)
- **Option B:** Call OpenRouter directly from the Worker for LLM-driven decisions
- **Option C:** Use a separate microservice (or Durable Object) that can run Bun/Node

**Recommendation:** Start with **Option A** (rule-based) for reliability and cost. Add LLM later as an upgrade.

**Effort:** 6–8 hours

---

### Priority 2: Turn Regeneration in Cloud
**Status:** Local CLI regenerates turns on load. Cloud has no equivalent.

Add turn regeneration to `GET /api/player/ship`:
1. Read `last_action_at` from `player_ships`
2. Calculate hours idle: `floor((now - last_action_at) / 3600)`
3. Regenerate `hours * TURNS_PER_HOUR` (capped at `max_turns`)
4. Return regenerated turns in response
5. Update `last_action_at = now`

**Effort:** 1–2 hours

---

### Priority 3: LLM Integration in Worker
**Status:** `NPC_MODEL` env var is set, but no code uses it.

The Worker has `OPENROUTER_API_KEY` as a secret. To use it:
1. Add a `fetch()` call to OpenRouter in the Worker
2. Build prompts from NPC persona + game state
3. Parse structured JSON responses
4. Apply actions (move, trade, attack)

**Challenge:** Prompt engineering and response validation need to be Worker-safe (no engine imports). Consider extracting just the prompt builder + parser into a Worker-compatible module.

**Effort:** 4–6 hours

---

### Priority 4: Email Magic Links
**Status:** `POST /api/auth/register` returns a token directly. No email is sent.

Integrate Resend or Postmark:
1. `POST /api/auth/login` — accepts email, generates token, sends magic link
2. `GET /api/auth/verify?token=` — validates token from email click
3. Store email service API key as `wrangler secret put EMAIL_API_KEY`

**Effort:** 3–4 hours

---

### Priority 5: Admin Panel
**Status:** No admin interface exists.

Build a simple HTML admin page (protected by `ADMIN_SECRET`):
- Galaxy list (active, player count, last tick)
- Manual galaxy reset trigger
- Player list (email, net worth, last login)
- Cost dashboard (placeholder for now)

**Effort:** 4–5 hours

---

## Cross-Cutting Concerns

### Game Balance
- Profitable trade routes exist but may need tuning after cloud deployment (more players = more competition for goods)
- Combat difficulty: test with real play sessions, tune flee chance and bribe costs
- Upgrade costs vs. credit earning rate

### Testing Strategy
- **Local:** `./tw3002` — verify all screens, save/load, turn regen
- **Cloud:** `curl` the API endpoints, verify auth, trade, combat
- **Integration:** CLI in cloud mode hitting the deployed Worker

### Documentation
- `GAME_GUIDE.md` — update when new features land (cloud mode, turn regen behavior)
- `cli/AGENTS.md` — update when conventions change
- `cloud/AGENTS.md` — update when architecture decisions shift

---

## Recommended Order of Attack

**This week:**
1. CLI: npm publish (30 min)
2. Cloud: Turn regeneration endpoint (1–2 hours)
3. CLI: Wire cloud mode game loop (4–6 hours)

**Next week:**
4. Cloud: NPC tick endpoint (rule-based) (6–8 hours)
5. Cloud: Email magic links (3–4 hours)

**Later:**
6. Cloud: LLM integration in Worker (4–6 hours)
7. Cloud: Admin panel (4–5 hours)
8. CLI: Settings expansion (2–3 hours)

---

*See `cli/AGENTS.md` and `cloud/AGENTS.md` for detailed conventions and gotchas.*
