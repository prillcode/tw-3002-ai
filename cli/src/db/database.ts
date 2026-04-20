import { Database } from 'bun:sqlite';
import { mkdirSync } from 'fs';

const DB_DIR = `${process.env.HOME}/.tw3002`;
export const DB_PATH = `${DB_DIR}/saves.db`;

/**
 * Initialize SQLite database for game saves.
 * Creates directory and database file if they don't exist.
 * Supports 3 save slots (Galaxy A, B, C) for local play.
 */
export const initDatabase = (): Database => {
  // Ensure directory exists
  try {
    mkdirSync(DB_DIR, { recursive: true });
  } catch (err) {
    // Directory might already exist
  }
  
  const db = new Database(DB_PATH);
  
  // Check if we need to migrate from old schema (id column) to new (slot_id)
  const tableInfo = db.query("PRAGMA table_info(saves)").all() as any[];
  const hasIdColumn = tableInfo.some(col => col.name === 'id');
  const hasSlotIdColumn = tableInfo.some(col => col.name === 'slot_id');
  
  if (hasIdColumn && !hasSlotIdColumn) {
    // Migrate old schema to new
    db.run(`
      CREATE TABLE saves_new (
        slot_id INTEGER PRIMARY KEY CHECK (slot_id BETWEEN 1 AND 3),
        ship_name TEXT,
        credits INTEGER DEFAULT 5000,
        current_sector INTEGER DEFAULT 42,
        cargo_ore INTEGER DEFAULT 0,
        cargo_organics INTEGER DEFAULT 0,
        cargo_equipment INTEGER DEFAULT 0,
        hull INTEGER DEFAULT 100,
        turns INTEGER DEFAULT 100,
        max_turns INTEGER DEFAULT 100,
        galaxy_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Copy old save to slot 1
    db.run(`
      INSERT INTO saves_new (slot_id, ship_name, credits, current_sector,
        cargo_ore, cargo_organics, cargo_equipment, hull, turns, max_turns)
      SELECT 1, ship_name, credits, current_sector,
        cargo_ore, cargo_organics, cargo_equipment, hull, turns, max_turns
      FROM saves WHERE id = 1
    `);
    
    db.run(`DROP TABLE saves`);
    db.run(`ALTER TABLE saves_new RENAME TO saves`);
  } else if (!hasSlotIdColumn) {
    // Create fresh table with slot_id
    db.run(`
      CREATE TABLE IF NOT EXISTS saves (
        slot_id INTEGER PRIMARY KEY CHECK (slot_id BETWEEN 1 AND 3),
        ship_name TEXT,
        credits INTEGER DEFAULT 5000,
        current_sector INTEGER DEFAULT 0,
        cargo_ore INTEGER DEFAULT 0,
        cargo_organics INTEGER DEFAULT 0,
        cargo_equipment INTEGER DEFAULT 0,
        hull INTEGER DEFAULT 100,
        turns INTEGER DEFAULT 100,
        max_turns INTEGER DEFAULT 100,
        ship_class_id TEXT DEFAULT 'merchant',
        upgrades_data TEXT DEFAULT '{}',
        galaxy_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
  
  // Migration: add galaxy_data column if missing
  const currentColumns = db.query("PRAGMA table_info(saves)").all() as any[];
  const hasGalaxyData = currentColumns.some(col => col.name === 'galaxy_data');
  if (!hasGalaxyData) {
    db.run(`ALTER TABLE saves ADD COLUMN galaxy_data TEXT`);
  }
  
  // Migration: add ship_class_id and upgrades_data columns
  const hasShipClassId = currentColumns.some(col => col.name === 'ship_class_id');
  if (!hasShipClassId) {
    db.run(`ALTER TABLE saves ADD COLUMN ship_class_id TEXT DEFAULT 'merchant'`);
  }
  const hasUpgradesData = currentColumns.some(col => col.name === 'upgrades_data');
  if (!hasUpgradesData) {
    db.run(`ALTER TABLE saves ADD COLUMN upgrades_data TEXT DEFAULT '{}'`);
  }
  
  return db;
};

export type { Database };
