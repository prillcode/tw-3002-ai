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
}

export interface SaveInfo {
  shipName: string;
  updatedAt: string;
}

/**
 * Save current game state to SQLite.
 * Uses INSERT OR REPLACE to update existing save (id is always 1).
 */
export const saveGame = (db: Database, state: GameState): void => {
  db.run(
    `INSERT INTO saves (
      id, ship_name, credits, current_sector,
      cargo_ore, cargo_organics, cargo_equipment,
      hull, turns, max_turns, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      ship_name = excluded.ship_name,
      credits = excluded.credits,
      current_sector = excluded.current_sector,
      cargo_ore = excluded.cargo_ore,
      cargo_organics = excluded.cargo_organics,
      cargo_equipment = excluded.cargo_equipment,
      hull = excluded.hull,
      turns = excluded.turns,
      max_turns = excluded.max_turns,
      updated_at = excluded.updated_at`,
    [
      1, // Single save slot
      state.shipName,
      state.credits,
      state.currentSector,
      state.cargo.ore,
      state.cargo.organics,
      state.cargo.equipment,
      state.hull,
      state.turns,
      state.maxTurns
    ]
  );
};

/**
 * Load game state from SQLite.
 * Returns null if no save exists.
 */
export const loadGame = (db: Database): GameState | null => {
  const row = db.query(
    'SELECT * FROM saves WHERE id = 1'
  ).get() as any;
  
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
    maxTurns: row.max_turns
  };
};

/**
 * Check if a save game exists.
 */
export const hasSave = (db: Database): boolean => {
  const result = db.query(
    'SELECT COUNT(*) as count FROM saves WHERE id = 1'
  ).get() as any;
  return result.count > 0;
};

/**
 * Get save info for display in menu.
 */
export const getSaveInfo = (db: Database): SaveInfo | null => {
  const row = db.query(
    'SELECT ship_name, updated_at FROM saves WHERE id = 1'
  ).get() as any;
  
  if (!row) return null;
  
  return {
    shipName: row.ship_name,
    updatedAt: row.updated_at
  };
};

/**
 * Clear the save game (for New Game).
 */
export const clearSave = (db: Database): void => {
  db.run('DELETE FROM saves WHERE id = 1');
};

/**
 * Safe load with error handling.
 */
export const safeLoadGame = (db: Database): GameState | null => {
  try {
    return loadGame(db);
  } catch (err) {
    console.error('Failed to load save:', err);
    return null;
  }
};
