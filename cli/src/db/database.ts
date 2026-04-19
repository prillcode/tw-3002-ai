import { Database } from 'bun:sqlite';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

const DB_DIR = `${process.env.HOME}/.tw3002`;
const DB_PATH = `${DB_DIR}/saves.db`;

/**
 * Initialize SQLite database for game saves.
 * Creates directory and database file if they don't exist.
 */
export const initDatabase = (): Database => {
  // Ensure directory exists
  try {
    mkdirSync(DB_DIR, { recursive: true });
  } catch (err) {
    // Directory might already exist, that's fine
  }
  
  const db = new Database(DB_PATH);
  
  // Create saves table
  db.run(`
    CREATE TABLE IF NOT EXISTS saves (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      ship_name TEXT NOT NULL,
      credits INTEGER DEFAULT 5000,
      current_sector INTEGER DEFAULT 42,
      cargo_ore INTEGER DEFAULT 0,
      cargo_organics INTEGER DEFAULT 0,
      cargo_equipment INTEGER DEFAULT 0,
      hull INTEGER DEFAULT 100,
      turns INTEGER DEFAULT 100,
      max_turns INTEGER DEFAULT 100,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  return db;
};

export type { Database };
