-- TW-13 Phase 4/5: Mines + blockade metadata support

ALTER TABLE player_ships ADD COLUMN limpets INTEGER NOT NULL DEFAULT 0;
ALTER TABLE player_ships ADD COLUMN armids INTEGER NOT NULL DEFAULT 0;
ALTER TABLE player_ships ADD COLUMN limpet_attached INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS sector_mines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  galaxy_id INTEGER NOT NULL,
  sector_index INTEGER NOT NULL,
  owner_id INTEGER NOT NULL,
  limpet_count INTEGER NOT NULL DEFAULT 0,
  armid_count INTEGER NOT NULL DEFAULT 0,
  deployed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(galaxy_id, sector_index, owner_id)
);

CREATE INDEX IF NOT EXISTS idx_sector_mines_lookup
  ON sector_mines(galaxy_id, sector_index);

CREATE INDEX IF NOT EXISTS idx_sector_mines_owner
  ON sector_mines(owner_id, galaxy_id);
