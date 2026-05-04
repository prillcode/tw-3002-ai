-- Daily missions per player per galaxy
CREATE TABLE IF NOT EXISTS player_daily_missions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  galaxy_id INTEGER NOT NULL,
  mission_type TEXT NOT NULL,
  target_count INTEGER NOT NULL DEFAULT 1,
  current_count INTEGER NOT NULL DEFAULT 0,
  reward_credits INTEGER NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 0,
  claimed INTEGER NOT NULL DEFAULT 0,
  claimed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  mission_date TEXT NOT NULL,
  UNIQUE(player_id, galaxy_id, mission_type, mission_date)
);

CREATE INDEX IF NOT EXISTS idx_missions_player_galaxy_date ON player_daily_missions(player_id, galaxy_id, mission_date);

-- Track visited sectors server-side for mission progress
ALTER TABLE player_ships ADD COLUMN visited_sectors_json TEXT DEFAULT '[]';
