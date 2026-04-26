-- TW-05 PvP Infrastructure migration

ALTER TABLE player_ships ADD COLUMN reputation INTEGER NOT NULL DEFAULT 0;
ALTER TABLE player_ships ADD COLUMN insurance_expires DATETIME;

CREATE INDEX IF NOT EXISTS idx_pvp_kills_galaxy ON pvp_kills(galaxy_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_pvp_kills_killer ON pvp_kills(killer_player_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_pvp_kills_victim ON pvp_kills(victim_player_id, timestamp);
