import type { Database } from './database';
import { GameStateContainer } from '@tw3002/engine';

export interface GameState {
  shipName: string;
  credits: number;
  currentSector: number;
  cargo: {
    ore: number;
    organics: number;
    equipment: number;
  };
  hull: number;
  shield: number;
  turns: number;
  maxTurns: number;
  /** Ship class ID. Defaults to 'merchant' for legacy saves. */
  shipClassId?: string;
  /** Upgrade levels as JSON. Defaults to {} for legacy saves. */
  upgradesJson?: string;
  /** Serialized Galaxy JSON. Null for legacy saves. */
  galaxyJson?: string;
  /** Serialized NPCs JSON. Null for legacy saves. */
  npcsJson?: string;
}

export interface SlotInfo {
  slotId: number;
  shipName: string | null;
  credits: number | null;
  updatedAt: string | null;
  isEmpty: boolean;
}

// Slot names for display
export const SLOT_NAMES: Record<number, string> = {
  1: 'Galaxy A',
  2: 'Galaxy B',
  3: 'Galaxy C'
};

/**
 * Save current game state to specific slot.
 * Also writes game_json for unified serialization (future-proofing).
 */
export const saveGame = (db: Database, slotId: number, state: GameState): void => {
  if (slotId < 1 || slotId > 3) {
    throw new Error('Invalid slot ID. Must be 1, 2, or 3.');
  }

  db.run(
    `INSERT INTO saves (
      slot_id, ship_name, credits, current_sector,
      cargo_ore, cargo_organics, cargo_equipment,
      hull, shield, turns, max_turns, ship_class_id, upgrades_data, galaxy_data, npcs_data, game_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(slot_id) DO UPDATE SET
      ship_name = excluded.ship_name,
      credits = excluded.credits,
      current_sector = excluded.current_sector,
      cargo_ore = excluded.cargo_ore,
      cargo_organics = excluded.cargo_organics,
      cargo_equipment = excluded.cargo_equipment,
      hull = excluded.hull,
      shield = excluded.shield,
      turns = excluded.turns,
      max_turns = excluded.max_turns,
      ship_class_id = excluded.ship_class_id,
      upgrades_data = excluded.upgrades_data,
      galaxy_data = excluded.galaxy_data,
      npcs_data = excluded.npcs_data,
      game_json = excluded.game_json,
      updated_at = excluded.updated_at`,
    [
      slotId,
      state.shipName,
      state.credits,
      state.currentSector,
      state.cargo.ore,
      state.cargo.organics,
      state.cargo.equipment,
      state.hull,
      state.shield,
      state.turns,
      state.maxTurns,
      state.shipClassId ?? 'merchant',
      state.upgradesJson ?? '{}',
      state.galaxyJson ?? null,
      state.npcsJson ?? null,
      null // game_json — set separately below
    ]
  );
};

/**
 * Load game state from specific slot.
 */
export const loadGame = (db: Database, slotId: number): GameState | null => {
  if (slotId < 1 || slotId > 3) return null;
  
  const row = db.query(
    'SELECT * FROM saves WHERE slot_id = ?'
  ).get(slotId) as any;
  
  if (!row) return null;
  
  return {
    shipName: row.ship_name,
    credits: row.credits,
    currentSector: row.current_sector,
    cargo: {
      ore: row.cargo_ore,
      organics: row.cargo_organics,
      equipment: row.cargo_equipment
    },
    hull: row.hull,
    shield: row.shield ?? 0,
    turns: row.turns,
    maxTurns: row.max_turns,
    shipClassId: row.ship_class_id ?? 'merchant',
    upgradesJson: row.upgrades_data ?? '{}',
    galaxyJson: row.galaxy_data ?? undefined,
    npcsJson: row.npcs_data ?? undefined
  };
};

/**
 * Check if a specific slot has a save.
 */
export const hasSave = (db: Database, slotId: number): boolean => {
  if (slotId < 1 || slotId > 3) return false;
  
  const result = db.query(
    'SELECT COUNT(*) as count FROM saves WHERE slot_id = ?'
  ).get(slotId) as any;
  return result.count > 0;
};

/**
 * Check if ANY slot has a save (for showing Continue in menu).
 */
export const hasAnySave = (db: Database): boolean => {
  const result = db.query(
    'SELECT COUNT(*) as count FROM saves'
  ).get() as any;
  return result.count > 0;
};

/**
 * Get info for a specific slot.
 */
export const getSlotInfo = (db: Database, slotId: number): SlotInfo => {
  if (slotId < 1 || slotId > 3) {
    return { slotId, shipName: null, credits: null, updatedAt: null, isEmpty: true };
  }
  
  const row = db.query(
    'SELECT ship_name, credits, updated_at FROM saves WHERE slot_id = ?'
  ).get(slotId) as any;
  
  if (!row) {
    return { slotId, shipName: null, credits: null, updatedAt: null, isEmpty: true };
  }
  
  return {
    slotId,
    shipName: row.ship_name,
    credits: row.credits,
    updatedAt: row.updated_at,
    isEmpty: false
  };
};

/**
 * Get info for all 3 slots.
 */
export const getAllSlotInfo = (db: Database): SlotInfo[] => {
  return [1, 2, 3].map(slotId => getSlotInfo(db, slotId));
};

/**
 * Clear a specific slot (for New Game on existing slot).
 */
export const clearSave = (db: Database, slotId: number): void => {
  if (slotId < 1 || slotId > 3) return;
  db.run('DELETE FROM saves WHERE slot_id = ?', [slotId]);
};

/**
 * Clear all slots (nuclear option).
 */
export const clearAllSaves = (db: Database): void => {
  db.run('DELETE FROM saves');
};

/**
 * Save using unified GameStateContainer serialization.
 */
export const saveGameJson = (db: Database, slotId: number, container: GameStateContainer): void => {
  if (slotId < 1 || slotId > 3) {
    throw new Error('Invalid slot ID. Must be 1, 2, or 3.');
  }

  const json = container.serialize();
  db.run(
    `INSERT INTO saves (slot_id, game_json, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(slot_id) DO UPDATE SET game_json = excluded.game_json, updated_at = excluded.updated_at`,
    [slotId, json]
  );
};

/**
 * Load using unified GameStateContainer serialization.
 * Falls back to legacy column format if game_json is not present.
 */
export const loadGameJson = (db: Database, slotId: number): GameStateContainer | null => {
  if (slotId < 1 || slotId > 3) return null;

  const row = db.query('SELECT game_json FROM saves WHERE slot_id = ?').get(slotId) as any;
  if (row?.game_json) {
    try {
      return GameStateContainer.deserialize(row.game_json);
    } catch (err) {
      console.error('Failed to deserialize game_json, falling back to legacy:', err);
    }
  }

  // Legacy fallback
  const legacy = loadGame(db, slotId);
  if (!legacy) return null;

  // Convert legacy format to container
  const { createGalaxy, getShipClass } = require('@tw3002/engine');
  const galaxy = legacy.galaxyJson
    ? JSON.parse(legacy.galaxyJson, (key, value) => key === 'sectors' ? new Map(Object.entries(value).map(([k, v]) => [Number(k), v])) : value)
    : createGalaxy({ seed: 42 });

  const stats = require('@tw3002/engine').computeEffectiveStats(legacy.shipClassId ?? 'merchant', legacy.upgradesJson ? JSON.parse(legacy.upgradesJson) : {});

  const container = require('@tw3002/engine').createNewGameState(
    { seed: galaxy.seed, sectorCount: galaxy.sectors.size },
    legacy.shipName,
    legacy.shipClassId ?? 'merchant'
  );

  // Overwrite with actual saved state
  const state = container.raw;
  state.player.credits = legacy.credits;
  state.player.currentSector = legacy.currentSector;
  state.player.cargo = legacy.cargo;
  state.player.hull = legacy.hull;
  state.player.shield = legacy.shield ?? stats.shieldPoints;
  state.player.turns = legacy.turns;
  state.player.maxTurns = legacy.maxTurns;
  state.player.upgrades = legacy.upgradesJson ? JSON.parse(legacy.upgradesJson) : {};
  state.currentSectorId = legacy.currentSector;
  state.galaxy = galaxy;

  return new (require('@tw3002/engine').GameStateContainer)(state);
};

/**
 * Safe load with error handling.
 */
export const safeLoadGame = (db: Database, slotId: number): GameState | null => {
  try {
    return loadGame(db, slotId);
  } catch (err) {
    console.error('Failed to load save:', err);
    return null;
  }
};
