/**
 * Versioned SQLite schema migrations.
 * Inline SQL strings — works in compiled binaries without file I/O.
 */

export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'create_initial_saves',
    sql: `
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,
  },
  {
    version: 2,
    name: 'add_galaxy_data',
    sql: `ALTER TABLE saves ADD COLUMN galaxy_data TEXT`,
  },
  {
    version: 3,
    name: 'add_ship_class_and_upgrades',
    sql: `
      ALTER TABLE saves ADD COLUMN ship_class_id TEXT DEFAULT 'merchant';
      ALTER TABLE saves ADD COLUMN upgrades_data TEXT DEFAULT '{}';
    `,
  },
  {
    version: 4,
    name: 'add_shield',
    sql: `ALTER TABLE saves ADD COLUMN shield INTEGER DEFAULT 0`,
  },
  {
    version: 5,
    name: 'add_game_json',
    sql: `ALTER TABLE saves ADD COLUMN game_json TEXT`,
  },
  {
    version: 6,
    name: 'add_npcs_data',
    sql: `ALTER TABLE saves ADD COLUMN npcs_data TEXT`,
  },
  {
    version: 7,
    name: 'add_last_action_at',
    sql: `ALTER TABLE saves ADD COLUMN last_action_at TEXT`,
  },
];

const BASELINE_SQL = `
  -- Baseline: ensure all columns from migrations 1-6 exist
  -- This handles the transition from the old ad-hoc migration system

  -- Create table if completely missing
  CREATE TABLE IF NOT EXISTS saves (
    slot_id INTEGER PRIMARY KEY CHECK (slot_id BETWEEN 1 AND 3),
    ship_name TEXT,
    credits INTEGER DEFAULT 5000,
    current_sector INTEGER DEFAULT 0,
    cargo_ore INTEGER DEFAULT 0,
    cargo_organics INTEGER DEFAULT 0,
    cargo_equipment INTEGER DEFAULT 0,
    hull INTEGER DEFAULT 100,
    shield INTEGER DEFAULT 0,
    turns INTEGER DEFAULT 100,
    max_turns INTEGER DEFAULT 100,
    ship_class_id TEXT DEFAULT 'merchant',
    upgrades_data TEXT DEFAULT '{}',
    galaxy_data TEXT,
    npcs_data TEXT,
    game_json TEXT,
    last_action_at TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Add missing columns (idempotent for partial old schemas)
  ALTER TABLE saves ADD COLUMN galaxy_data TEXT;
  ALTER TABLE saves ADD COLUMN ship_class_id TEXT DEFAULT 'merchant';
  ALTER TABLE saves ADD COLUMN upgrades_data TEXT DEFAULT '{}';
  ALTER TABLE saves ADD COLUMN shield INTEGER DEFAULT 0;
  ALTER TABLE saves ADD COLUMN game_json TEXT;
  ALTER TABLE saves ADD COLUMN npcs_data TEXT;
  ALTER TABLE saves ADD COLUMN last_action_at TEXT;
`;

/**
 * Run all pending migrations. Idempotent — safe to call multiple times.
 * Handles the transition from pre-versioned schemas via baseline.
 */
export function runMigrations(db: import('bun:sqlite').Database): void {
  // Create migration tracking table
  db.run(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Check if this is an old database (saves exists but no migration records)
  const savesExists = db.query(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='saves'"
  ).get();

  const hasMigrationRecords = db.query(
    "SELECT COUNT(*) as count FROM schema_migrations"
  ).get() as { count: number };

  if (savesExists && hasMigrationRecords.count === 0) {
    // Old database from pre-versioned era — run baseline to ensure schema is current,
    // then mark all migrations as applied
    try {
      // SQLite doesn't support IF NOT EXISTS on ALTER TABLE, so we catch errors
      for (const stmt of BASELINE_SQL.split(';').map(s => s.trim()).filter(Boolean)) {
        try {
          db.run(stmt);
        } catch {
          // Column likely already exists — ignore
        }
      }
    } catch {
      // Baseline is best-effort for old schemas
    }

    // Mark all current migrations as applied
    for (const migration of MIGRATIONS) {
      db.run(
        `INSERT OR IGNORE INTO schema_migrations (version) VALUES (?)`,
        [migration.version]
      );
    }
    return;
  }

  // Normal migration flow: run only pending migrations
  const appliedVersions = new Set(
    (db.query('SELECT version FROM schema_migrations').all() as { version: number }[])
      .map(r => r.version)
  );

  for (const migration of MIGRATIONS) {
    if (appliedVersions.has(migration.version)) continue;

    // Run each statement in the migration separately (SQLite can't do multiple
    // ALTER TABLE in one prepared statement)
    const statements = migration.sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const stmt of statements) {
      db.run(stmt + ';');
    }

    db.run(
      `INSERT INTO schema_migrations (version) VALUES (?)`,
      [migration.version]
    );
  }
}
