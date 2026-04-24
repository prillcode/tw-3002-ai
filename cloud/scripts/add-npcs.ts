/**
 * Add 110 more NPCs to the existing cloud galaxy (40 → 150).
 * Uses a different seed offset to avoid duplicates.
 *
 * Usage:
 *   cd cloud && bun run scripts/add-npcs.ts > scripts/add-npcs.sql
 *   npx wrangler d1 execute tw3002-galaxy --remote --file=scripts/add-npcs.sql
 */

import { createGalaxy, generateNPCs } from '../../packages/engine/src/index.js';

const GALAXY_SEED = 42;
const EXISTING_COUNT = 40;
const TARGET_COUNT = 150;
const ADDITIONAL_COUNT = TARGET_COUNT - EXISTING_COUNT;
const ADDITIONAL_SEED = GALAXY_SEED + 1; // offset to get unique NPCs

const galaxy = createGalaxy({ sectorCount: 1000, seed: GALAXY_SEED });

// Generate 150 total, then slice off the first 40 (which are already in the DB)
const allNPCs = generateNPCs(galaxy, TARGET_COUNT, ADDITIONAL_SEED);
const newNPCs = allNPCs.slice(EXISTING_COUNT);

const lines: string[] = [];

for (const npc of newNPCs) {
  lines.push(
    `INSERT INTO npcs (galaxy_id, npc_id, persona_json, current_sector, ship_json, credits, cargo_json, memory_json) VALUES (` +
    `1, '${escapeSql(npc.id)}', '${escapeSql(JSON.stringify(npc.persona))}', ${npc.currentSectorId}, ` +
    `'${escapeSql(JSON.stringify(npc.ship))}', ${npc.credits}, '${escapeSql(JSON.stringify(npc.cargo))}', ` +
    `'${escapeSql(JSON.stringify({ last3: [], grudges: [], alliances: [], marketObs: [] }))}'` +
    `);`
  );
}

console.log(lines.join('\n'));

function escapeSql(str: string): string {
  return str.replace(/'/g, "''");
}
