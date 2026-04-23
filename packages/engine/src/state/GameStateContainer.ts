/**
 * Centralized game state container with validated mutations.
 */
import type { GameState, Result, CombatRecord } from './types.js';
import type { CombatResult } from '../combat/types.js';
import type { NPC, NewsItem } from '../npcs/types.js';
import { canMoveTo, canTrade, canPurchaseUpgrade, validateState } from './validators.js';
import { computeEffectiveStats, purchaseUpgrade } from '../ships/upgrades.js';
import { getNeighborIds } from '../galaxy/generator.js';

export class GameStateContainer {
  constructor(private state: GameState) {}

  // ── Read-only getters ────────────────────────────────────

  get raw(): GameState {
    return this.state;
  }

  get galaxy() {
    return this.state.galaxy;
  }

  get player() {
    return this.state.player;
  }

  get currentSectorId() {
    return this.state.currentSectorId;
  }

  get currentSector() {
    return this.state.galaxy.sectors.get(this.state.currentSectorId)!;
  }

  get effectiveStats() {
    return computeEffectiveStats(this.state.player.classId, this.state.player.upgrades);
  }

  get turnsUsed() {
    return this.state.turnsUsed;
  }

  get npcs() {
    return this.state.npcs;
  }

  get news() {
    return this.state.news;
  }

  // ── NPC queries ──────────────────────────────────────────

  getNPCsInSector(sectorId: number): NPC[] {
    return this.state.npcs.filter(n => n.currentSectorId === sectorId);
  }

  getActiveNPCs(playerSectorId: number, radius: number = 2): NPC[] {
    const active = new Set<number>([playerSectorId]);
    const queue = [{ id: playerSectorId, dist: 0 }];
    const visited = new Set<number>([playerSectorId]);

    while (queue.length > 0) {
      const { id, dist } = queue.shift()!;
      if (dist >= radius) continue;
      for (const n of getNeighborIds(this.state.galaxy, id)) {
        if (!visited.has(n)) {
          visited.add(n);
          active.add(n);
          queue.push({ id: n, dist: dist + 1 });
        }
      }
    }

    return this.state.npcs.filter(n => active.has(n.currentSectorId));
  }

  /**
   * Update NPCs and return new container.
   */
  updateNPCs(npcs: NPC[]): GameStateContainer {
    return new GameStateContainer({
      ...this.state,
      npcs,
      lastPlayedAt: new Date().toISOString(),
    });
  }

  /**
   * Add a news item.
   */
  addNews(item: NewsItem): GameStateContainer {
    return new GameStateContainer({
      ...this.state,
      news: [...this.state.news, item].slice(-20),
      lastPlayedAt: new Date().toISOString(),
    });
  }

  // ── Validated mutations ──────────────────────────────────

  /**
   * Move to a connected sector. Costs 1 turn.
   */
  moveTo(sectorId: number): Result<GameStateContainer> {
    if (!canMoveTo(this.state, sectorId)) {
      return { ok: false, error: 'Cannot move to that sector' };
    }

    const newState: GameState = {
      ...this.state,
      currentSectorId: sectorId,
      player: {
        ...this.state.player,
        turns: this.state.player.turns - 1,
        shield: this.effectiveStats.shieldPoints, // regenerate shield on jump
      },
      turnsUsed: this.state.turnsUsed + 1,
      lastPlayedAt: new Date().toISOString(),
    };

    return { ok: true, value: new GameStateContainer(newState) };
  }

  /**
   * Execute a trade at the current sector's port.
   * The caller must validate via canTrade() and compute via engine.executeTrade().
   * This method just applies the result.
   */
  applyTradeResult(cargo: Record<string, number>, credits: number): GameStateContainer {
    const newState: GameState = {
      ...this.state,
      player: {
        ...this.state.player,
        cargo: {
          ore: cargo.ore ?? this.state.player.cargo.ore,
          organics: cargo.organics ?? this.state.player.cargo.organics,
          equipment: cargo.equipment ?? this.state.player.cargo.equipment,
        },
        credits,
      },
      lastPlayedAt: new Date().toISOString(),
    };
    return new GameStateContainer(newState);
  }

  /**
   * Apply combat result to player state.
   */
  applyCombatResult(result: CombatResult): Result<GameStateContainer> {
    const stats = this.effectiveStats;
    let newPlayer = { ...this.state.player };

    if (result.playerDestroyed) {
      // Respawn penalties
      const fedCenter = this.state.galaxy.fedSpace[0] ?? 0;
      newPlayer.credits = Math.floor(newPlayer.credits * 0.9);
      newPlayer.hull = stats.maxHull;
      newPlayer.shield = stats.shieldPoints;

      const newState: GameState = {
        ...this.state,
        player: newPlayer,
        currentSectorId: fedCenter,
        combatLog: [...this.state.combatLog, {
          timestamp: new Date().toISOString(),
          enemyName: result.rounds[0] ? 'Unknown' : 'Unknown',
          result: 'defeat',
          rounds: result.rounds.length,
          damageDealt: result.totalDamageDealt,
          damageTaken: result.totalDamageTaken,
          creditsDelta: -Math.floor(this.state.player.credits * 0.1),
        }],
      };
      return { ok: true, value: new GameStateContainer(newState) };
    }

    newPlayer.credits += result.creditsGained - result.creditsLost;
    newPlayer.hull = result.hullRemaining;
    newPlayer.shield = result.shieldRemaining;

    const combatRecord: CombatRecord = {
      timestamp: new Date().toISOString(),
      enemyName: result.rounds[0]?.log[0]?.split('"')[1] ?? 'Unknown',
      result: result.victory ? 'victory' : result.fled ? 'fled' : result.bribed ? 'bribed' : 'defeat',
      rounds: result.rounds.length,
      damageDealt: result.totalDamageDealt,
      damageTaken: result.totalDamageTaken,
      creditsDelta: result.creditsGained - result.creditsLost,
    };

    const newState: GameState = {
      ...this.state,
      player: newPlayer,
      combatLog: [...this.state.combatLog, combatRecord].slice(-20),
      lastPlayedAt: new Date().toISOString(),
    };

    return { ok: true, value: new GameStateContainer(newState) };
  }

  /**
   * Purchase a ship upgrade.
   */
  purchaseUpgrade(upgradeId: string): Result<GameStateContainer> {
    const validation = canPurchaseUpgrade(this.state, upgradeId);
    if (!validation.ok) {
      return { ok: false, error: validation.reason };
    }

    const result = purchaseUpgrade(this.state.player, upgradeId);
    if (!result.success) {
      return { ok: false, error: result.reason };
    }

    const newState: GameState = {
      ...this.state,
      player: result.ship,
      lastPlayedAt: new Date().toISOString(),
    };

    return { ok: true, value: new GameStateContainer(newState) };
  }

  /**
   * Update player cargo after trade (bypasses validation for engine-calculated results).
   */
  updateCargo(cargo: Record<string, number>): GameStateContainer {
    const newState: GameState = {
      ...this.state,
      player: {
        ...this.state.player,
        cargo: {
          ore: cargo.ore ?? this.state.player.cargo.ore,
          organics: cargo.organics ?? this.state.player.cargo.organics,
          equipment: cargo.equipment ?? this.state.player.cargo.equipment,
        },
      },
      lastPlayedAt: new Date().toISOString(),
    };
    return new GameStateContainer(newState);
  }

  /**
   * Update player credits.
   */
  updateCredits(credits: number): GameStateContainer {
    const newState: GameState = {
      ...this.state,
      player: {
        ...this.state.player,
        credits,
      },
      lastPlayedAt: new Date().toISOString(),
    };
    return new GameStateContainer(newState);
  }

  // ── Serialization ────────────────────────────────────────

  serialize(): string {
    return JSON.stringify({
      ...this.state,
      galaxy: {
        ...this.state.galaxy,
        sectors: Object.fromEntries(this.state.galaxy.sectors),
      },
    });
  }

  static deserialize(json: string): GameStateContainer {
    const raw = JSON.parse(json);
    const state: GameState = {
      ...raw,
      galaxy: {
        ...raw.galaxy,
        sectors: new Map(Object.entries(raw.galaxy.sectors).map(([k, v]) => [Number(k), v])),
      },
    };
    return new GameStateContainer(state);
  }
}
