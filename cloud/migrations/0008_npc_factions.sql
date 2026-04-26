-- TW-18: Backfill NPC faction field on existing persona_json
-- Adds faction identity for all currently active NPCs without changing combat stats.

UPDATE npcs
SET persona_json = json_set(
  persona_json,
  '$.faction',
  CASE
    WHEN json_extract(persona_json, '$.type') = 'patrol' THEN 'choam'
    WHEN json_extract(persona_json, '$.type') = 'trader' THEN CASE WHEN (id % 10) < 3 THEN 'choam' ELSE 'independent' END
    WHEN json_extract(persona_json, '$.type') = 'raider' THEN CASE WHEN (id % 10) < 6 THEN 'fremen' ELSE 'sardaukar' END
    ELSE 'independent'
  END
)
WHERE json_extract(persona_json, '$.faction') IS NULL;

-- Optional light flavor refresh for a handful of raiders (easter egg nods)
UPDATE npcs
SET persona_json = json_set(persona_json, '$.name',
  CASE
    WHEN (id % 7) = 0 THEN 'Stilgar Sandrider'
    WHEN (id % 11) = 0 THEN 'Chani the Knife'
    ELSE json_extract(persona_json, '$.name')
  END
)
WHERE json_extract(persona_json, '$.type') = 'raider';
