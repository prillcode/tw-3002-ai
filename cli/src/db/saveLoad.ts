import type { Database } from './database';

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
  turns: number;
  maxTurns: number;
  /** Serialized Galaxy JSON (new in engine migration). Null for legacy saves. */
  galaxyJson?: string;
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
 */
export const saveGame = (db: Database, slotId: number, state: GameState): void => {
  if (slotId < 1 || slotId > 3) {
    throw new Error('Invalid slot ID. Must be 1, 2, or 3.');
  }
  
  db.run(
    `INSERT INTO saves (
      slot_id, ship_name, credits, current_sector,
      cargo_ore, cargo_organics, cargo_equipment,
      hull, turns, max_turns, galaxy_data, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(slot_id) DO UPDATE SET
      ship_name = excluded.ship_name,
      credits = excluded.credits,
      current_sector = excluded.current_sector,
      cargo_ore = excluded.cargo_ore,
      cargo_organics = excluded.cargo_organics,
      cargo_equipment = excluded.cargo_equipment,
      hull = excluded.hull,
      turns = excluded.turns,
      max_turns = excluded.max_turns,
      galaxy_data = excluded.galaxy_data,
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
      state.turns,
      state.maxTurns,
      state.galaxyJson ?? null
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
    turns: row.turns,
    maxTurns: row.max_turns,
    galaxyJson: row.galaxy_data ?? undefined
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
