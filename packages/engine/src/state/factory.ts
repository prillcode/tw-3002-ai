/**
 * Factory functions for creating GameState instances.
 */
import type { GameState } from './types.js';
import type { GalaxyConfig } from '../types.js';
import { GameStateContainer } from './GameStateContainer.js';
import { createGalaxy } from '../galaxy/generator.js';
import { getShipClass } from '../ships/upgrades.js';
import { generateNPCs } from '../npcs/generator.js';

/**
 * Create a fresh game state for a new game.
 */
export function createNewGameState(
  galaxyConfig: GalaxyConfig,
  shipName: string,
  shipClassId: string,
): GameStateContainer {
  const galaxy = createGalaxy(galaxyConfig);
  const shipClass = getShipClass(shipClassId) ?? getShipClass('merchant')!;
  const stats = shipClass.baseStats;

  const startingSector = galaxy.fedSpace[0] ?? 0;

  const state: GameState = {
    galaxy,
    player: {
      name: shipName,
      classId: shipClassId,
      credits: 5000,
      currentSector: startingSector,
      cargo: { ore: 0, organics: 0, equipment: 0 },
      hull: stats.maxHull,
      shield: stats.shieldPoints,
      turns: stats.maxTurns,
      maxTurns: stats.maxTurns,
      upgrades: {},
    },
    currentSectorId: startingSector,
    turnsUsed: 0,
    turnsRegenRate: 0,
    lastPlayedAt: new Date().toISOString(),
    combatLog: [],
    tradeLog: [],
    npcs: generateNPCs(galaxy, 20, galaxyConfig.seed + 1),
    news: [{
      timestamp: new Date().toISOString(),
      headline: `Welcome to the galaxy, Commander ${shipName}!`,
      type: 'event',
    }],
  };

  return new GameStateContainer(state);
}
