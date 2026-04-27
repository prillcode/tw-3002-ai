-- TW-15 Phase 1: Alignment + Experience + Rank + Commission state

ALTER TABLE player_ships ADD COLUMN alignment INTEGER NOT NULL DEFAULT 0;
ALTER TABLE player_ships ADD COLUMN experience INTEGER NOT NULL DEFAULT 0;
ALTER TABLE player_ships ADD COLUMN rank INTEGER NOT NULL DEFAULT 1;
ALTER TABLE player_ships ADD COLUMN commissioned INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_player_ships_alignment ON player_ships(galaxy_id, alignment);
