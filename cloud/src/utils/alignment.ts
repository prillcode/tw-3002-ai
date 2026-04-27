import type { D1Database } from '@cloudflare/workers-types';

export interface RankInfo {
  rank: number;
  title: string;
  minExperience: number;
}

export const RANK_TABLE: RankInfo[] = [
  { rank: 1, title: 'Private', minExperience: 2 },
  { rank: 2, title: 'Private 1st Class', minExperience: 4 },
  { rank: 3, title: 'Lance Corporal', minExperience: 8 },
  { rank: 4, title: 'Corporal', minExperience: 16 },
  { rank: 5, title: 'Sergeant', minExperience: 32 },
  { rank: 6, title: 'Staff Sergeant', minExperience: 64 },
  { rank: 7, title: 'Gunnery Sergeant', minExperience: 128 },
  { rank: 8, title: '1st Sergeant', minExperience: 256 },
  { rank: 9, title: 'Sergeant Major', minExperience: 512 },
  { rank: 10, title: 'Warrant Officer', minExperience: 1024 },
  { rank: 11, title: 'Chief Warrant Officer', minExperience: 2048 },
  { rank: 12, title: 'Ensign', minExperience: 4096 },
  { rank: 13, title: 'Lieutenant J.G.', minExperience: 8192 },
  { rank: 14, title: 'Lieutenant', minExperience: 16384 },
  { rank: 15, title: 'Lieutenant Commander', minExperience: 32768 },
  { rank: 16, title: 'Commander', minExperience: 65536 },
  { rank: 17, title: 'Captain', minExperience: 131072 },
  { rank: 18, title: 'Commodore', minExperience: 262144 },
  { rank: 19, title: 'Rear Admiral', minExperience: 524288 },
  { rank: 20, title: 'Vice Admiral', minExperience: 1048576 },
  { rank: 21, title: 'Admiral', minExperience: 2097152 },
  { rank: 22, title: 'Fleet Admiral', minExperience: 4194304 },
];

export function clampAlignment(value: number): number {
  return Math.max(-1000, Math.min(1000, Math.round(value)));
}

export function getRankInfo(experience: number): { current: RankInfo; next: RankInfo | null } {
  const exp = Math.max(0, Math.floor(experience));
  let current = RANK_TABLE[0]!;
  for (const rank of RANK_TABLE) {
    if (exp >= rank.minExperience) current = rank;
    else break;
  }

  const next = RANK_TABLE.find((r) => r.rank === current.rank + 1) ?? null;
  return { current, next };
}

export function getFactionStanding(alignment: number): {
  alignmentLabel: 'good' | 'neutral' | 'evil';
  standing: string;
  canRob: boolean;
  fremenNeutral: boolean;
  sardaukarTarget: boolean;
} {
  if (alignment >= 1000) {
    return {
      alignmentLabel: 'good',
      standing: 'CHOAM Commissioned',
      canRob: false,
      fremenNeutral: false,
      sardaukarTarget: true,
    };
  }

  if (alignment > 0) {
    return {
      alignmentLabel: 'good',
      standing: 'CHOAM Friendly',
      canRob: false,
      fremenNeutral: false,
      sardaukarTarget: true,
    };
  }

  if (alignment === 0) {
    return {
      alignmentLabel: 'neutral',
      standing: 'Independent',
      canRob: false,
      fremenNeutral: false,
      sardaukarTarget: true,
    };
  }

  if (alignment <= -100) {
    return {
      alignmentLabel: 'evil',
      standing: 'Outlaw',
      canRob: true,
      fremenNeutral: true,
      sardaukarTarget: false,
    };
  }

  return {
    alignmentLabel: 'evil',
    standing: 'Smuggler',
    canRob: false,
    fremenNeutral: false,
    sardaukarTarget: false,
  };
}

export async function applyAlignmentAndExperience(
  db: D1Database,
  playerId: number,
  galaxyId: number,
  changes: { alignmentDelta?: number; experienceDelta?: number; setCommissioned?: boolean; setAlignment?: number },
): Promise<{ alignment: number; experience: number; rank: number }> {
  const row = await db
    .prepare('SELECT alignment, experience, rank, commissioned FROM player_ships WHERE player_id = ? AND galaxy_id = ?')
    .bind(playerId, galaxyId)
    .first<{ alignment: number; experience: number; rank: number; commissioned: number }>();

  if (!row) {
    return { alignment: 0, experience: 0, rank: 1 };
  }

  let alignment = row.alignment ?? 0;
  let experience = row.experience ?? 0;

  if (changes.setAlignment !== undefined) {
    alignment = clampAlignment(changes.setAlignment);
  }

  if (changes.alignmentDelta) {
    alignment = clampAlignment(alignment + changes.alignmentDelta);
  }

  if (changes.experienceDelta) {
    experience = Math.max(0, Math.floor(experience + changes.experienceDelta));
  }

  const { current } = getRankInfo(experience);
  const commissioned = changes.setCommissioned ? 1 : row.commissioned;

  await db
    .prepare('UPDATE player_ships SET alignment = ?, experience = ?, rank = ?, commissioned = ?, updated_at = datetime("now") WHERE player_id = ? AND galaxy_id = ?')
    .bind(alignment, experience, current.rank, commissioned, playerId, galaxyId)
    .run();

  return { alignment, experience, rank: current.rank };
}
