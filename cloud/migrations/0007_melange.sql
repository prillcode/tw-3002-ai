-- TW-18: Add melange to existing ports in dangerous/caution sectors
-- Only ports in non-safe sectors carry melange (rare, ~5,000 cr/unit, 15-75 supply)

-- Use a JS script to do this properly since D1 SQL doesn't have random()
-- Instead, we add melange at fixed prices with deterministic supply based on sector_index

-- For all existing ports in dangerous/caution sectors that don't already have melange:
UPDATE sectors
SET port_inventory_json = json_set(
  port_inventory_json,
  '$.melange',
  json('{"price":' || (4000 + (sector_index % 2000)) || ',"supply":' || (15 + (sector_index % 60)) || '}')
)
WHERE galaxy_id = 1
  AND port_class IS NOT NULL
  AND danger IN ('dangerous', 'caution')
  AND port_inventory_json NOT LIKE '%melange%';
