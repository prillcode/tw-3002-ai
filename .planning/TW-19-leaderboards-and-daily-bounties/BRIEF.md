# TW-19: Leaderboards & Daily Bounties

## Work Identity
- **ID:** TW-19
- **Type:** Feature
- **Scope:** Server-side daily mission system + leaderboard enhancements + web client UI

## Objective
Give players a reason to log in every day by adding a rotating daily bounty/mission system with credit rewards. Enhance the existing leaderboard with persistent rankings, player profile pages, and new competitive stats.

## Context
The core game loop (move, trade, fight, claim planets) is solid but lacks structured goals. A daily mission system provides short-term objectives and rewards that create a habit loop. The existing leaderboard (`/api/leaderboard`) and wanted/bounty system are functional but static — they don't track historical performance or give players a public identity.

## Scope

### In Scope
- **Daily Bounty System**
  - 3 rotating daily missions per player (e.g., "Kill 3 NPCs", "Trade 10,000 credits", "Visit 5 new sectors")
  - Credit rewards scaled by difficulty
  - Progress tracking in D1 (`player_daily_missions` table)
  - Reset at 00:00 UTC
  - "Reroll" one mission per day for a fee
- **Leaderboard Enhancements**
  - Weekly / All-Time ranking tabs (not just current snapshot)
  - Player public profile pages (`/player/:shipName` or similar)
  - New stats: planets held, alignment rank, experience, total trades
- **Web Client UI**
  - Daily bounties panel in sector view (or modal)
  - Mission progress bars
  - Claim reward button
  - Leaderboard enhancements (tabs, filters, player click-through)

### Out of Scope
- Achievement/badge system (permanent unlocks — defer to later)
- Guild/fleet leaderboards
- Seasonal/battle pass system
- Push notifications for mission completion
- Mobile app

## Success Criteria
1. Players see 3 daily missions when they log in
2. Missions auto-generate based on player state (no impossible missions)
3. Completing a mission grants credits immediately
4. Leaderboard shows weekly and all-time rankings
5. Clicking a player on the leaderboard shows their public profile
6. All new endpoints are rate-limited and documented

## Relevant Files
- [`cloud/src/routes/combat.ts`](../../../cloud/src/routes/combat.ts)
- [`cloud/src/routes/player.ts`](../../../cloud/src/routes/player.ts)
- [`cloud/src/routes/action.ts`](../../../cloud/src/routes/action.ts)
- [`cloud/src/routes/news.ts`](../../../cloud/src/routes/news.ts)
- [`cloud/src/index.ts`](../../../cloud/src/index.ts)
- [`cloud/src/utils/actionBudget.ts`](../../../cloud/src/utils/actionBudget.ts)
- [`web/game/src/views/LeaderboardView.vue`](../../../web/game/src/views/LeaderboardView.vue)
- [`web/game/src/views/SectorView.vue`](../../../web/game/src/views/SectorView.vue)
- [`web/game/src/stores/ship.ts`](../../../web/game/src/stores/ship.ts)
- [`web/game/src/stores/ui.ts`](../../../web/game/src/stores/ui.ts)
