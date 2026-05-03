-- TW-12 Phase 1: Action budget system
-- Players get 60 action points, regenerating 1/min (cap 60).
-- Gameplay actions deduct points; insufficient points return 403.

ALTER TABLE player_ships ADD COLUMN action_points INTEGER NOT NULL DEFAULT 60;
ALTER TABLE player_ships ADD COLUMN action_points_refill_at DATETIME;

-- Seed existing players with full points
UPDATE player_ships SET action_points = 60, action_points_refill_at = datetime('now');
