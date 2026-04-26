-- TW-14: Planets & Citadels

-- Planet ownership and state
CREATE TABLE IF NOT EXISTS planets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  galaxy_id INTEGER NOT NULL,
  sector_index INTEGER NOT NULL,
  owner_id INTEGER NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  class TEXT NOT NULL DEFAULT 'M',
  colonists INTEGER NOT NULL DEFAULT 0,
  fuel INTEGER NOT NULL DEFAULT 0,
  organics INTEGER NOT NULL DEFAULT 0,
  equipment INTEGER NOT NULL DEFAULT 0,
  fighters INTEGER NOT NULL DEFAULT 0,
  citadel_level INTEGER NOT NULL DEFAULT 0,
  sect_cannon_pct INTEGER NOT NULL DEFAULT 0,
  atmo_cannon_pct INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_planets_galaxy_sector
  ON planets(galaxy_id, sector_index);

CREATE INDEX IF NOT EXISTS idx_planets_owner
  ON planets(owner_id, galaxy_id);

-- Track planet count per sector for U-class probability
ALTER TABLE sectors ADD COLUMN planet_count INTEGER NOT NULL DEFAULT 0;
