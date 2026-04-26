/**
 * Standalone seed script — generates a 1000-sector galaxy and outputs SQL.
 *
 * Usage:
 *   cd cloud && bun run scripts/seed.ts > scripts/seed.sql
 *   npx wrangler d1 execute tw3002-galaxy --remote --file=scripts/seed.sql
 *
 * Or pipe directly:
 *   bun run scripts/seed.ts | npx wrangler d1 execute tw3002-galaxy --remote
 */

import { createGalaxy, generateNPCs } from '../../packages/engine/src/index.js';

const GALAXY_SEED = 42;
const SECTOR_COUNT = 1000;
const NPC_DENSITY = 0.15;
const NPC_COUNT = Math.round(SECTOR_COUNT * NPC_DENSITY);

const galaxy = createGalaxy({ sectorCount: SECTOR_COUNT, seed: GALAXY_SEED });
const npcs = generateNPCs(galaxy, NPC_COUNT, GALAXY_SEED);

const lines: string[] = [];

// Update galaxy metadata
lines.push(`UPDATE galaxies SET name = 'The Void — Shared Galaxy', slug = 'the-void', sector_count = ${SECTOR_COUNT}, config_json = '{"seed":${GALAXY_SEED},"sectorCount":${SECTOR_COUNT}}' WHERE id = 1;`);

const sectors = Array.from(galaxy.sectors.values());

// Pick 3-5 stardock sectors (generator's + extras)
const extraStardockCount = Math.floor(Math.random() * 3) + 2; // 2-4 extras
const stardockSet = new Set(galaxy.stardocks);
const nonFedSpaceIds = sectors.filter(s => !galaxy.fedSpace.includes(s.id)).map(s => s.id);
// Shuffle candidates
for (let i = nonFedSpaceIds.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [nonFedSpaceIds[i], nonFedSpaceIds[j]] = [nonFedSpaceIds[j], nonFedSpaceIds[i]];
}
let added = 0;
for (const id of nonFedSpaceIds) {
  if (stardockSet.has(id)) continue;
  stardockSet.add(id);
  added++;
  if (added >= extraStardockCount) break;
}

// Insert sectors
for (const sector of sectors) {
  const connections = galaxy.connections
    .filter(c => c.from === sector.id || c.to === sector.id)
    .map(c => (c.from === sector.id ? c.to : c.from));

  const port = sector.port;
  const portInventory = port
    ? {
        ore: { price: port.trades.find(t => t.commodity === 'ore')?.basePrice ?? 100, supply: port.inventory.ore },
        organics: { price: port.trades.find(t => t.commodity === 'organics')?.basePrice ?? 50, supply: port.inventory.organics },
        equipment: { price: port.trades.find(t => t.commodity === 'equipment')?.basePrice ?? 200, supply: port.inventory.equipment },
        ...(sector.danger === 'dangerous' || sector.danger === 'caution'
          ? { melange: { price: Math.round(4000 + Math.random() * 2000), supply: Math.round(15 + Math.random() * 60) } }
          : {}),
      }
    : {};

  const isStardock = stardockSet.has(sector.id) ? 1 : 0;

  lines.push(
    `INSERT INTO sectors (galaxy_id, sector_index, name, danger, port_class, port_name, port_inventory_json, connections_json, stardock) VALUES (` +
    `1, ${sector.id}, '${escapeSql(sector.name)}', '${sector.danger}', ` +
    `${port?.class ?? 'NULL'}, ${port ? `'${escapeSql(port.name)}'` : 'NULL'}, ` +
    `'${escapeSql(JSON.stringify(portInventory))}', '${escapeSql(JSON.stringify(connections))}', ${isStardock}` +
    `);`
  );
}

// Insert NPCs
for (const npc of npcs) {
  lines.push(
    `INSERT INTO npcs (galaxy_id, npc_id, persona_json, current_sector, ship_json, credits, cargo_json, memory_json) VALUES (` +
    `1, '${escapeSql(npc.id)}', '${escapeSql(JSON.stringify(npc.persona))}', ${npc.currentSectorId}, ` +
    `'${escapeSql(JSON.stringify(npc.ship))}', ${npc.credits}, '${escapeSql(JSON.stringify(npc.cargo))}', ` +
    `'${escapeSql(JSON.stringify({ last3: [], grudges: [], alliances: [], marketObs: [] }))}'` +
    `);`
  );
}

// Seed news item
lines.push(
  `INSERT INTO news (galaxy_id, headline, type) VALUES (1, 'The Void opens — ${SECTOR_COUNT} sectors, ${NPC_COUNT} ships enter the galaxy', 'event');`
);

console.log(lines.join('\n'));

function escapeSql(str: string): string {
  return str.replace(/'/g, "''");
}
