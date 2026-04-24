import { Database } from 'bun:sqlite';
import { mkdirSync } from 'fs';
import { runMigrations } from './migrations.js';

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
  } catch {
    // Directory might already exist
  }

  const db = new Database(DB_PATH);

  // Run versioned migrations (idempotent — safe to call every launch)
  runMigrations(db);

  return db;
};

export type { Database };
