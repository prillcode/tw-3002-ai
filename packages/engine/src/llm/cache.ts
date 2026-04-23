/**
 * LRU decision cache for NPC LLM calls.
 * Skips redundant API calls when the situation hasn't meaningfully changed.
 */
import type { NPC, NPCAction } from '../npcs/types.js';
import type { Galaxy } from '../types.js';
import type { PlayerShip } from '../ships/upgrades.js';

export interface CacheEntry {
  action: NPCAction;
  reasoning: string;
  timestamp: number;
}

export class DecisionCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private ttlMs: number;
  private hits = 0;
  private misses = 0;

  constructor(maxSize = 100, ttlMs = 30000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  get(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }
    this.hits++;
    return entry;
  }

  set(key: string, entry: CacheEntry): void {
    // LRU eviction: if at capacity, delete oldest
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, entry);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats(): { hits: number; misses: number; size: number; hitRate: number } {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      hitRate: total > 0 ? Math.round((this.hits / total) * 100) : 0,
    };
  }
}

// Module-level singleton (per-session)
export const globalCache = new DecisionCache();

/**
 * Determine if caching is appropriate for this NPC's situation.
 * Don't cache volatile situations.
 */
export function canUseCache(npc: NPC, players: PlayerShip[]): boolean {
  // Don't cache if player is in same sector (volatile)
  if (players.some(p => p.currentSector === npc.currentSectorId)) return false;
  // Don't cache if hull is low (desperate)
  if (npc.ship.hull / npc.ship.maxHull < 0.5) return false;
  // Don't cache if new grudge formed recently (emotional)
  const recentGrudge = npc.memory.grudges.some(g => {
    const age = Date.now() - new Date(g.formedAt).getTime();
    return age < 60000; // 1 minute
  });
  if (recentGrudge) return false;
  return true;
}

/**
 * Build a cache key from NPC state.
 * Coarsen values so minor changes don't bust the cache.
 */
export function makeCacheKey(npc: NPC, galaxy: Galaxy, players: PlayerShip[]): string {
  const sector = galaxy.sectors.get(npc.currentSectorId);
  const playerHere = players.some(p => p.currentSector === npc.currentSectorId);
  const hullPct = Math.round((npc.ship.hull / npc.ship.maxHull) * 10) / 10;
  const shieldPct = Math.round((npc.ship.shield / npc.ship.maxShield) * 10) / 10;
  const cargoTotal = Object.values(npc.cargo).reduce((a, b) => a + b, 0);
  const hasGrudge = npc.memory.grudges.some(g => g.targetId === 'player');

  return [
    npc.persona.type,
    sector?.danger ?? 'unknown',
    playerHere ? 'player-yes' : 'player-no',
    `hull-${hullPct}`,
    `shield-${shieldPct}`,
    `cargo-${cargoTotal}`,
    hasGrudge ? 'grudge-yes' : 'grudge-no',
    npc.memory.lastActions[0]?.action.type ?? 'none',
  ].join('|');
}
