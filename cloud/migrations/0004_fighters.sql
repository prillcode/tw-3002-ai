-- TW-13 Phase 1: Fighter purchase + deployment

ALTER TABLE player_ships ADD COLUMN fighters INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS sector_fighters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  galaxy_id INTEGER NOT NULL,
  sector_index INTEGER NOT NULL,
  owner_id INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  mode TEXT NOT NULL DEFAULT 'defensive', -- defensive | offensive | tolled
  deployed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(galaxy_id, sector_index, owner_id)
);

CREATE INDEX IF NOT EXISTS idx_sector_fighters_lookup
  ON sector_fighters(galaxy_id, sector_index);

CREATE INDEX IF NOT EXISTS idx_sector_fighters_owner
  ON sector_fighters(owner_id, galaxy_id);
