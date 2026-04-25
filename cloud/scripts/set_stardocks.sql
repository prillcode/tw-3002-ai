-- Targeted UPDATE to set stardock flags on existing galaxy
UPDATE sectors SET stardock = 1 WHERE galaxy_id = 1 AND sector_index IN (13, 250, 500, 750);
