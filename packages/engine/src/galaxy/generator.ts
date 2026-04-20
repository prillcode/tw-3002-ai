/**
 * Galaxy generator — creates a complete Galaxy from configuration.
 * Orchestrates layout, naming, port placement, and danger zones.
 */
import { SeededRandom } from '../rng.js';
import { createNameGenerator } from './names.js';
import { placeSectors, generateConnections, verifyConnectivity } from './layout.js';
import type { Galaxy, GalaxyConfig, Sector, Port, PortTrade, Connection, Commodity, DangerLevel } from '../types.js';

export const DEFAULT_CONFIG: GalaxyConfig = {
  sectorCount: 100,
  seed: 0, // caller should override
  fedSpaceRadius: 2,
  portDensity: 0.4,
  stardockCount: 1,
};

/** Commodity base prices */
const BASE_PRICES: Record<Commodity, number> = {
  ore: 100,
  organics: 50,
  equipment: 200,
};

/** Region commodity specializations */
const REGION_SPECIALIZATIONS: Record<string, Commodity> = {
  'The Core': 'equipment',
  'Inner Reach': 'organics',
  'Midward Expanse': 'ore',
  'Outer Colonies': 'ore',
  'Pirate Alleys': 'equipment',
  'The Fringe': 'ore',
  'Dust Belt': 'ore',
  'Azure Expanse': 'organics',
  'Crimson Void': 'equipment',
  'Emerald Drift': 'organics',
  'Iron Nebula': 'ore',
  'Shadow Marches': 'equipment',
  'Solar Heights': 'organics',
  'Obsidian Deep': 'equipment',
  'Titan Rift': 'ore',
};

const COMMODITIES: Commodity[] = ['ore', 'organics', 'equipment'];

/**
 * Generate a complete galaxy from config.
 *
 * @param config - Galaxy generation parameters. Set seed=0 for random.
 * @returns A fully populated Galaxy object.
 */
export function createGalaxy(config: Partial<GalaxyConfig> = {}): Galaxy {
  const fullConfig: GalaxyConfig = { ...DEFAULT_CONFIG, ...config };
  if (fullConfig.seed === 0) fullConfig.seed = Date.now();

  const rng = new SeededRandom(fullConfig.seed);
  const names = createNameGenerator();

  const n = fullConfig.sectorCount;

  // ── Regions ──
  // Divide sectors into 5-8 regions based on distance from center
  const regionCount = Math.min(8, Math.max(5, Math.floor(n / 15)));
  const regions: string[] = [];
  for (let i = 0; i < regionCount; i++) {
    regions.push(names.regionName(i));
  }

  // ── FedSpace ──
  // Central cluster: sectors 0..fedSpaceCount-1
  const fedSpaceCount = Math.min(Math.max(3, Math.floor(n * 0.06)), 10);

  // ── Layout ──
  const layoutSectors = placeSectors(n, fedSpaceCount, rng);
  const fedSpaceIds = layoutSectors.slice(0, fedSpaceCount).map(s => s.id);

  // ── Connections ──
  const layoutConnections = generateConnections(layoutSectors, fedSpaceIds, rng, 3);

  // Verify connectivity
  const { connected } = verifyConnectivity(n, layoutConnections);
  if (!connected) {
    throw new Error('Galaxy generation produced disconnected graph. Try a different seed.');
  }

  // ── Build adjacency map for danger calculation ──
  const adjMap = new Map<number, number[]>();
  for (let i = 0; i < n; i++) adjMap.set(i, []);
  for (const conn of layoutConnections) {
    adjMap.get(conn.from)!.push(conn.to);
    adjMap.get(conn.to)!.push(conn.from);
  }

  // ── BFS distance from FedSpace (for danger levels) ──
  const distances = new Map<number, number>();
  const bfsQueue = [...fedSpaceIds];
  for (const id of fedSpaceIds) distances.set(id, 0);

  while (bfsQueue.length > 0) {
    const current = bfsQueue.shift()!;
    const currentDist = distances.get(current) ?? 0;
    for (const neighbor of adjMap.get(current) ?? []) {
      if (!distances.has(neighbor)) {
        distances.set(neighbor, currentDist + 1);
        bfsQueue.push(neighbor);
      }
    }
  }

  // ── Assign regions based on angular position ──
  const centerX = layoutSectors.reduce((s, sec) => s + sec.x, 0) / n;
  const centerY = layoutSectors.reduce((s, sec) => s + sec.y, 0) / n;

  function getRegion(sectorId: number): string {
    const sector = layoutSectors[sectorId]!;
    const angle = Math.atan2(sector.y - centerY, sector.x - centerX);
    // Map angle [-PI, PI] to region index
    const normalized = ((angle + Math.PI) / (2 * Math.PI)) * regionCount;
    return regions[Math.floor(normalized) % regionCount]!;
  }

  // ── Port placement ──
  const portCandidateIds = [...Array(n).keys()].filter(id => !fedSpaceIds.includes(id));
  rng.shuffle(portCandidateIds);
  const portCount = Math.floor(n * fullConfig.portDensity);
  const portSectorIds = new Set(portCandidateIds.slice(0, portCount));

  // ── StarDock placement (inside or adjacent to FedSpace) ──
  const stardockIds: number[] = [];
  const stardockCandidates = [...fedSpaceIds];
  // Also consider sectors adjacent to FedSpace
  for (const fsId of fedSpaceIds) {
    for (const neighbor of adjMap.get(fsId) ?? []) {
      if (!fedSpaceIds.includes(neighbor)) {
        stardockCandidates.push(neighbor);
      }
    }
  }
  rng.shuffle(stardockCandidates);
  for (let i = 0; i < fullConfig.stardockCount && i < stardockCandidates.length; i++) {
    stardockIds.push(stardockCandidates[i]!);
  }

  // ── Build sectors ──
  const sectors = new Map<number, Sector>();
  let sectorNameIndex = 0;

  for (let i = 0; i < n; i++) {
    const layout = layoutSectors[i]!;
    const isFedSpace = fedSpaceIds.includes(i);
    const isStardock = stardockIds.includes(i);
    const hasPort = portSectorIds.has(i);
    const region = isFedSpace ? 'The Core' : getRegion(i);
    const distFromFed = distances.get(i) ?? 0;

    // Danger level based on distance from FedSpace
    let danger: DangerLevel;
    if (isFedSpace || distFromFed <= fullConfig.fedSpaceRadius) {
      danger = 'safe';
    } else if (distFromFed <= fullConfig.fedSpaceRadius + 3) {
      danger = 'caution';
    } else {
      danger = 'dangerous';
    }

    // Name
    let sectorName: string;
    if (isFedSpace) {
      sectorName = i === 0 ? 'FedSpace Alpha' : `FedSpace ${String.fromCharCode(65 + fedSpaceIds.indexOf(i))}`;
    } else {
      sectorName = names.sectorName(rng.fork());
      sectorNameIndex++;
    }

    // Port
    let port: Port | undefined;
    if (hasPort || isStardock) {
      const portClass = isStardock ? 1 as const : (rng.nextInt(1, 3) as 1 | 2 | 3);
      const specialization = REGION_SPECIALIZATIONS[region] ?? rng.pick(COMMODITIES);

      port = generatePort(rng, names, portClass, specialization, sectorName, isStardock);
    }

    sectors.set(i, {
      id: i,
      name: sectorName,
      coords: { x: layout.x, y: layout.y },
      port,
      danger,
      region,
    });
  }

  // ── Build connections with types ──
  const connections: Connection[] = layoutConnections.map(lc => ({
    from: lc.from,
    to: lc.to,
    type: 'warp' as const,
  }));

  // ── Galaxy ID ──
  const galaxyId = `galaxy-${fullConfig.seed.toString(36)}-${Date.now().toString(36)}`;

  return {
    id: galaxyId,
    seed: fullConfig.seed,
    sectors,
    connections,
    fedSpace: fedSpaceIds,
    stardocks: stardockIds,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Generate a port with trades and inventory.
 */
function generatePort(
  rng: SeededRandom,
  names: ReturnType<typeof createNameGenerator>,
  portClass: 1 | 2 | 3,
  specialization: Commodity,
  sectorName: string,
  isStardock: boolean,
): Port {
  const portName = isStardock ? 'StarDock Prime' : names.portName(rng, portClass);
  const trades: PortTrade[] = [];

  // All ports trade all 3 commodities
  for (const commodity of COMMODITIES) {
    const isSpecialist = commodity === specialization;
    const base = BASE_PRICES[commodity];

    if (isSpecialist) {
      // Specialist: buys this commodity (wants it), good price
      trades.push({
        commodity,
        direction: 'buy',
        basePrice: Math.round(base * rng.nextFloat(0.85, 0.95)),
      });
    } else {
      // Non-specialist: sells this commodity, slight markup
      trades.push({
        commodity,
        direction: 'sell',
        basePrice: Math.round(base * rng.nextFloat(1.0, 1.1)),
      });
    }
  }

  // Ports also need a second direction — add a balanced trade
  // At least one commodity the port sells, one it buys
  const buys = trades.filter(t => t.direction === 'buy');
  const sells = trades.filter(t => t.direction === 'sell');

  // If all are buys, flip the weakest to sell
  if (sells.length === 0 && buys.length > 0) {
    const weakest = buys.reduce((a, b) => a.basePrice < b.basePrice ? a : b);
    weakest.direction = 'sell';
    weakest.basePrice = Math.round(BASE_PRICES[weakest.commodity] * rng.nextFloat(1.05, 1.15));
  }

  // If all are sells, flip the cheapest to buy
  if (buys.length === 0 && sells.length > 0) {
    const cheapest = sells.reduce((a, b) => a.basePrice < b.basePrice ? a : b);
    cheapest.direction = 'buy';
    cheapest.basePrice = Math.round(BASE_PRICES[cheapest.commodity] * rng.nextFloat(0.9, 1.0));
  }

  // Inventory based on class
  const inventoryBase = portClass === 1 ? 2000 : portClass === 2 ? 1000 : 500;
  const inventory: Record<Commodity, number> = {
    ore: inventoryBase + rng.nextInt(-200, 200),
    organics: inventoryBase + rng.nextInt(-200, 200),
    equipment: Math.round(inventoryBase * 0.6) + rng.nextInt(-100, 100),
  };

  // Clamp inventories
  for (const key of COMMODITIES) {
    inventory[key] = Math.max(100, inventory[key]!);
  }

  const restockRate = portClass === 1 ? 50 : portClass === 2 ? 30 : 15;

  return {
    name: portName,
    class: portClass,
    trades,
    inventory,
    restockRate,
  };
}

/**
 * Get neighbors of a sector from the galaxy's connection list.
 */
export function getNeighborIds(galaxy: Galaxy, sectorId: number): number[] {
  const neighbors: number[] = [];
  for (const conn of galaxy.connections) {
    if (conn.from === sectorId) neighbors.push(conn.to);
    else if (conn.to === sectorId) neighbors.push(conn.from);
  }
  return neighbors;
}
