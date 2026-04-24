/**
 * Turn regeneration system.
 * Players regain turns over real time while away from the game.
 */

export interface TurnRegenResult {
  /** Turns after regeneration */
  turns: number;
  /** Turns that were regenerated */
  regenerated: number;
  /** Hours since last action */
  hoursIdle: number;
}

/** Turns regenerated per hour of real time */
export const TURNS_PER_HOUR = 1;

/**
 * Calculate how many turns to regenerate based on time elapsed.
 * Caps at maxTurns — never overfill.
 */
export function regenerateTurns(
  currentTurns: number,
  maxTurns: number,
  lastActionAt: Date | string | null,
  now: Date = new Date()
): TurnRegenResult {
  if (!lastActionAt) {
    return { turns: currentTurns, regenerated: 0, hoursIdle: 0 };
  }

  const last = typeof lastActionAt === 'string' ? new Date(lastActionAt) : lastActionAt;
  const msIdle = now.getTime() - last.getTime();
  const hoursIdle = Math.max(0, Math.floor(msIdle / (1000 * 60 * 60)));

  const regenerated = hoursIdle * TURNS_PER_HOUR;
  const turns = Math.min(maxTurns, currentTurns + regenerated);

  return { turns, regenerated, hoursIdle };
}

/**
 * Format idle time for display (e.g. "2h 15m" or "3 days").
 */
export function formatIdleTime(lastActionAt: Date | string | null): string {
  if (!lastActionAt) return '';

  const last = typeof lastActionAt === 'string' ? new Date(lastActionAt) : lastActionAt;
  const ms = Date.now() - last.getTime();

  const minutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}
