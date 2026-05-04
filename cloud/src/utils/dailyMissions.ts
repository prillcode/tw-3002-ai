/**
 * Daily mission system — generation, progress tracking, rewards, rerolls.
 *
 * Players get 3 rotating missions per day (UTC). Completing them grants credits.
 * Rerolling costs credits. Progress is tracked via explicit hooks in action handlers.
 */

import type { D1Database } from '@cloudflare/workers-types';

export interface Mission {
  id: number;
  type: string;
  targetCount: number;
  currentCount: number;
  rewardCredits: number;
  completed: boolean;
  claimed: boolean;
  progress: number;
}

interface MissionTemplate {
  type: string;
  minTarget: number;
  maxTarget: number;
  minReward: number;
  maxReward: number;
}

const MISSION_TEMPLATES: Record<string, MissionTemplate[]> = {
  easy: [
    { type: 'kill_npcs', minTarget: 2, maxTarget: 3, minReward: 500, maxReward: 1_000 },
    { type: 'visit_sectors', minTarget: 3, maxTarget: 5, minReward: 400, maxReward: 700 },
    { type: 'pay_taxes', minTarget: 1, maxTarget: 1, minReward: 300, maxReward: 500 },
  ],
  medium: [
    { type: 'kill_npcs', minTarget: 5, maxTarget: 8, minReward: 1_500, maxReward: 2_500 },
    { type: 'trade_credits', minTarget: 10_000, maxTarget: 20_000, minReward: 1_500, maxReward: 2_500 },
    { type: 'visit_sectors', minTarget: 8, maxTarget: 12, minReward: 1_000, maxReward: 1_800 },
    { type: 'claim_planet', minTarget: 1, maxTarget: 1, minReward: 1_500, maxReward: 2_500 },
    { type: 'pay_taxes', minTarget: 3, maxTarget: 3, minReward: 800, maxReward: 1_200 },
  ],
  hard: [
    { type: 'kill_npcs', minTarget: 10, maxTarget: 15, minReward: 3_000, maxReward: 5_000 },
    { type: 'trade_credits', minTarget: 30_000, maxTarget: 50_000, minReward: 3_000, maxReward: 5_000 },
    { type: 'visit_sectors', minTarget: 15, maxTarget: 20, minReward: 2_000, maxReward: 3_500 },
    { type: 'claim_planet', minTarget: 2, maxTarget: 2, minReward: 3_000, maxReward: 4_000 },
    { type: 'pay_taxes', minTarget: 5, maxTarget: 5, minReward: 1_500, maxReward: 2_000 },
  ],
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getTodayUTC(): string {
  return new Date().toISOString().split('T')[0];
}

function pickWeightedDifficulty(): 'easy' | 'medium' | 'hard' {
  const r = Math.random();
  if (r < 0.40) return 'easy';
  if (r < 0.75) return 'medium';
  return 'hard';
}

function generateMissionFromTemplate(template: MissionTemplate): Omit<Mission, 'id' | 'currentCount' | 'completed' | 'claimed' | 'progress'> {
  return {
    type: template.type,
    targetCount: randInt(template.minTarget, template.maxTarget),
    rewardCredits: randInt(template.minReward, template.maxReward),
  };
}

/**
 * Generate daily missions for a player if they don't exist for today.
 * Returns all missions for today (existing or newly generated).
 */
export async function generateDailyMissions(
  db: D1Database,
  playerId: number,
  galaxyId: number,
): Promise<Mission[]> {
  const today = getTodayUTC();

  // Check existing missions for today
  const existing = await db
    .prepare('SELECT id, mission_type, target_count, current_count, reward_credits, completed, claimed FROM player_daily_missions WHERE player_id = ? AND galaxy_id = ? AND mission_date = ?')
    .bind(playerId, galaxyId, today)
    .all<{ id: number; mission_type: string; target_count: number; current_count: number; reward_credits: number; completed: number; claimed: number }>();

  if (existing.results && existing.results.length > 0) {
    return existing.results.map(row => ({
      id: row.id,
      type: row.mission_type,
      targetCount: row.target_count,
      currentCount: row.current_count,
      rewardCredits: row.reward_credits,
      completed: row.completed === 1,
      claimed: row.claimed === 1,
      progress: Math.min(100, Math.floor((row.current_count / Math.max(1, row.target_count)) * 100)),
    }));
  }

  // Generate 3 missions: one easy, one medium, one hard (weighted)
  const selectedTypes = new Set<string>();
  const missionsToInsert: Array<{ type: string; targetCount: number; rewardCredits: number; difficulty: string }> = [];

  for (let i = 0; i < 3; i++) {
    const difficulty = pickWeightedDifficulty();
    const pool = MISSION_TEMPLATES[difficulty];
    // Try to avoid duplicate types
    const available = pool.filter(t => !selectedTypes.has(t.type));
    const templates = available.length > 0 ? available : pool;
    const template = templates[Math.floor(Math.random() * templates.length)];
    selectedTypes.add(template.type);
    missionsToInsert.push({ ...generateMissionFromTemplate(template), difficulty });
  }

  // Insert all 3
  for (const m of missionsToInsert) {
    await db
      .prepare('INSERT INTO player_daily_missions (player_id, galaxy_id, mission_type, target_count, reward_credits, mission_date) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(playerId, galaxyId, m.type, m.targetCount, m.rewardCredits, today)
      .run();
  }

  // Fetch back to get IDs
  return generateDailyMissions(db, playerId, galaxyId);
}

/**
 * Increment progress for an active mission of the given type.
 * Called from action handlers after successful completion.
 */
export async function trackMissionProgress(
  db: D1Database,
  playerId: number,
  galaxyId: number,
  type: string,
  amount: number = 1,
): Promise<void> {
  const today = getTodayUTC();

  const mission = await db
    .prepare('SELECT id, target_count, current_count FROM player_daily_missions WHERE player_id = ? AND galaxy_id = ? AND mission_type = ? AND mission_date = ? AND claimed = 0')
    .bind(playerId, galaxyId, type, today)
    .first<{ id: number; target_count: number; current_count: number }>();

  if (!mission) return;

  const newCount = mission.current_count + amount;
  const completed = newCount >= mission.target_count ? 1 : 0;

  await db
    .prepare('UPDATE player_daily_missions SET current_count = ?, completed = ? WHERE id = ?')
    .bind(newCount, completed, mission.id)
    .run();
}

/**
 * Get today's missions for a player (generates if needed).
 */
export async function getTodaysMissions(
  db: D1Database,
  playerId: number,
  galaxyId: number,
): Promise<{ missions: Mission[]; allClaimed: boolean }> {
  const missions = await generateDailyMissions(db, playerId, galaxyId);
  const allClaimed = missions.length > 0 && missions.every(m => m.claimed);
  return { missions, allClaimed };
}

/**
 * Claim reward for a completed mission.
 */
export async function claimMissionReward(
  db: D1Database,
  playerId: number,
  galaxyId: number,
  missionId: number,
): Promise<{ success: boolean; reward: number; newCredits: number; error?: string }> {
  const today = getTodayUTC();

  const mission = await db
    .prepare('SELECT id, completed, claimed, reward_credits FROM player_daily_missions WHERE id = ? AND player_id = ? AND galaxy_id = ? AND mission_date = ?')
    .bind(missionId, playerId, galaxyId, today)
    .first<{ id: number; completed: number; claimed: number; reward_credits: number }>();

  if (!mission) return { success: false, reward: 0, newCredits: 0, error: 'Mission not found' };
  if (mission.claimed === 1) return { success: false, reward: 0, newCredits: 0, error: 'Already claimed' };
  if (mission.completed !== 1) return { success: false, reward: 0, newCredits: 0, error: 'Mission not completed' };

  // Update mission as claimed
  await db
    .prepare('UPDATE player_daily_missions SET claimed = 1, claimed_at = datetime("now") WHERE id = ?')
    .bind(missionId)
    .run();

  // Grant credits
  await db
    .prepare('UPDATE player_ships SET credits = credits + ?, updated_at = datetime("now") WHERE player_id = ? AND galaxy_id = ?')
    .bind(mission.reward_credits, playerId, galaxyId)
    .run();

  // Get new balance
  const ship = await db
    .prepare('SELECT credits FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
    .bind(playerId, galaxyId)
    .first<{ credits: number }>();

  return {
    success: true,
    reward: mission.reward_credits,
    newCredits: ship?.credits ?? 0,
  };
}

/**
 * Reroll an uncompleted mission for a credit cost.
 */
export async function rerollMission(
  db: D1Database,
  playerId: number,
  galaxyId: number,
  missionId: number,
): Promise<{ success: boolean; newMission?: Mission; cost: number; error?: string }> {
  const today = getTodayUTC();

  const mission = await db
    .prepare('SELECT id, mission_type, target_count, reward_credits, completed, claimed FROM player_daily_missions WHERE id = ? AND player_id = ? AND galaxy_id = ? AND mission_date = ?')
    .bind(missionId, playerId, galaxyId, today)
    .first<{ id: number; mission_type: string; target_count: number; reward_credits: number; completed: number; claimed: number }>();

  if (!mission) return { success: false, cost: 0, error: 'Mission not found' };
  if (mission.claimed === 1) return { success: false, cost: 0, error: 'Already claimed' };
  if (mission.completed === 1) return { success: false, cost: 0, error: 'Already completed' };

  const cost = Math.max(500, Math.floor(mission.reward_credits * 0.5));

  // Check player has enough credits
  const ship = await db
    .prepare('SELECT credits FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
    .bind(playerId, galaxyId)
    .first<{ credits: number }>();

  if (!ship || ship.credits < cost) {
    return { success: false, cost, error: `Need ${cost} credits to reroll` };
  }

  // Deduct cost
  await db
    .prepare('UPDATE player_ships SET credits = credits - ?, updated_at = datetime("now") WHERE player_id = ? AND galaxy_id = ?')
    .bind(cost, playerId, galaxyId)
    .run();

  // Determine difficulty tier from target_count (approximate)
  let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
  for (const [tier, templates] of Object.entries(MISSION_TEMPLATES)) {
    const template = templates.find(t => t.type === mission.mission_type);
    if (template && mission.target_count >= template.minTarget && mission.target_count <= template.maxTarget) {
      difficulty = tier as 'easy' | 'medium' | 'hard';
      break;
    }
  }

  // Get existing types to avoid duplicates
  const existing = await db
    .prepare('SELECT mission_type FROM player_daily_missions WHERE player_id = ? AND galaxy_id = ? AND mission_date = ? AND id != ?')
    .bind(playerId, galaxyId, today, missionId)
    .all<{ mission_type: string }>();
  const existingTypes = new Set(existing.results?.map(r => r.mission_type) ?? []);

  // Pick replacement from same difficulty tier, avoiding duplicates
  const pool = MISSION_TEMPLATES[difficulty];
  const available = pool.filter(t => !existingTypes.has(t.type));
  const templates = available.length > 0 ? available : pool;
  const template = templates[Math.floor(Math.random() * templates.length)];

  // Delete old mission
  await db.prepare('DELETE FROM player_daily_missions WHERE id = ?').bind(missionId).run();

  // Insert new mission
  const newMissionData = generateMissionFromTemplate(template);
  const insertResult = await db
    .prepare('INSERT INTO player_daily_missions (player_id, galaxy_id, mission_type, target_count, reward_credits, mission_date) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(playerId, galaxyId, newMissionData.type, newMissionData.targetCount, newMissionData.rewardCredits, today)
    .run();

  const newMission: Mission = {
    id: insertResult.meta?.last_row_id ?? 0,
    type: newMissionData.type,
    targetCount: newMissionData.targetCount,
    currentCount: 0,
    rewardCredits: newMissionData.rewardCredits,
    completed: false,
    claimed: false,
    progress: 0,
  };

  return { success: true, newMission, cost };
}
