-- Add stardock flag to sectors
ALTER TABLE sectors ADD COLUMN stardock INTEGER DEFAULT 0;
