-- D1 Schema for TW 3002 AI Cloud
-- Logically equivalent to local SQLite but adapted for D1

-- Galaxies (shared game worlds)
CREATE TABLE IF NOT EXISTS galaxies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sector_count INTEGER NOT NULL DEFAULT 100,
  active INTEGER NOT NULL DEFAULT 1,
  config_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sectors (galaxy nodes)
CREATE TABLE IF NOT EXISTS sectors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  galaxy_id INTEGER NOT NULL,
  sector_index INTEGER NOT NULL,
  name TEXT NOT NULL,
  danger TEXT DEFAULT 'safe',
  port_class INTEGER,
  port_name TEXT,
  port_inventory_json TEXT,
  connections_json TEXT,
  npcs_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(galaxy_id, sector_index)
);

-- Players (cloud save state)
CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  auth_token TEXT,
  token_expires_at DATETIME,
  last_login_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Player ships (one per galaxy per player)
CREATE TABLE IF NOT EXISTS player_ships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  galaxy_id INTEGER NOT NULL,
  ship_name TEXT NOT NULL,
  class_id TEXT DEFAULT 'merchant',
  credits INTEGER DEFAULT 5000,
  current_sector INTEGER DEFAULT 0,
  cargo_json TEXT DEFAULT '{}',
  hull INTEGER DEFAULT 100,
  shield INTEGER DEFAULT 0,
  turns INTEGER DEFAULT 80,
  max_turns INTEGER DEFAULT 80,
  upgrades_json TEXT DEFAULT '{}',
  net_worth INTEGER DEFAULT 5000,
  kills INTEGER DEFAULT 0,
  deaths INTEGER DEFAULT 0,
  wanted_kills INTEGER DEFAULT 0,
  is_pacifist INTEGER DEFAULT 0,
  last_action_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(player_id, galaxy_id)
);

-- NPCs (shared galaxy NPCs)
CREATE TABLE IF NOT EXISTS npcs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  galaxy_id INTEGER NOT NULL,
  npc_id TEXT NOT NULL UNIQUE,
  persona_json TEXT NOT NULL,
  current_sector INTEGER NOT NULL,
  ship_json TEXT NOT NULL,
  credits INTEGER DEFAULT 0,
  cargo_json TEXT DEFAULT '{}',
  memory_json TEXT DEFAULT '{}',
  is_active INTEGER DEFAULT 1,
  turns_since_spawn INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- News / Event log
CREATE TABLE IF NOT EXISTS news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  galaxy_id INTEGER NOT NULL,
  headline TEXT NOT NULL,
  type TEXT DEFAULT 'event',
  sector_id INTEGER,
  player_id INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- PvP kills
CREATE TABLE IF NOT EXISTS pvp_kills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  galaxy_id INTEGER NOT NULL,
  killer_player_id INTEGER,
  victim_player_id INTEGER,
  sector_id INTEGER NOT NULL,
  credits_looted INTEGER DEFAULT 0,
  cargo_looted_json TEXT DEFAULT '{}',
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sectors_galaxy ON sectors(galaxy_id);
CREATE INDEX IF NOT EXISTS idx_sectors_galaxy_index ON sectors(galaxy_id, sector_index);
CREATE INDEX IF NOT EXISTS idx_player_ships_galaxy ON player_ships(galaxy_id);
CREATE INDEX IF NOT EXISTS idx_player_ships_player ON player_ships(player_id);
CREATE INDEX IF NOT EXISTS idx_npcs_galaxy ON npcs(galaxy_id);
CREATE INDEX IF NOT EXISTS idx_npcs_sector ON npcs(galaxy_id, current_sector);
CREATE INDEX IF NOT EXISTS idx_news_galaxy ON news(galaxy_id, timestamp);
