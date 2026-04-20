/**
 * Galaxy layout engine — places sectors on a 2D grid and generates
 * a navigable warp lane network using MST + extra connections.
 */
import { SeededRandom } from '../rng.js';

export interface LayoutSector {
  id: number;
  x: number;
  y: number;
}

export interface LayoutConnection {
  from: number;
  to: number;
}

/**
 * Place sectors on a 2D grid with jittered positions.
 * FedSpace sectors cluster near center; others spread outward.
 */
export function placeSectors(
  sectorCount: number,
  fedSpaceCount: number,
  rng: SeededRandom,
): LayoutSector[] {
  const sectors: LayoutSector[] = [];
  const gridSize = Math.ceil(Math.sqrt(sectorCount));

  // FedSpace sectors: tight cluster near center
  const center = gridSize / 2;
  for (let i = 0; i < fedSpaceCount; i++) {
    const angle = (i / fedSpaceCount) * Math.PI * 2;
    const radius = rng.nextFloat(0.5, 2);
    sectors.push({
      id: i,
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
    });
  }

  // Remaining sectors: spiral outward with jitter
  for (let i = fedSpaceCount; i < sectorCount; i++) {
    const ring = Math.floor((i - fedSpaceCount) / 8) + 1;
    const angleOffset = (i * 2.39996); // golden angle for even distribution
    const angle = angleOffset + rng.nextFloat(-0.3, 0.3);
    const radius = ring * rng.nextFloat(1.5, 2.5);
    sectors.push({
      id: i,
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
    });
  }

  return sectors;
}

/**
 * Build a connected warp lane network:
 * 1. Minimum spanning tree (Prim's) to ensure connectivity
 * 2. Add extra connections for interesting topology
 *
 * Returns bidirectional connection list.
 */
export function generateConnections(
  sectors: LayoutSector[],
  fedSpaceIds: number[],
  rng: SeededRandom,
  targetAvgDegree: number = 3,
): LayoutConnection[] {
  const n = sectors.length;
  const connectionSet = new Set<string>();
  const connections: LayoutConnection[] = [];
  const adj = new Map<number, number[]>(); // adjacency for degree tracking
  for (let i = 0; i < n; i++) {
    adj.set(i, []);
  }

  const addConnection = (a: number, b: number) => {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (connectionSet.has(key)) return;
    connectionSet.add(key);
    connections.push({ from: Math.min(a, b), to: Math.max(a, b) });
    adj.get(a)!.push(b);
    adj.get(b)!.push(a);
  };

  const getDegree = (id: number) => adj.get(id)!.length;

  const dist = (a: LayoutSector, b: LayoutSector) =>
    Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

  // ── Step 1: Minimum spanning tree (Prim's) ──
  const inTree = new Set<number>();
  inTree.add(0); // start from sector 0 (FedSpace center)

  while (inTree.size < n) {
    let bestDist = Infinity;
    let bestFrom = -1;
    let bestTo = -1;

    // Find closest sector not in tree to any sector in tree
    for (const from of inTree) {
      const sFrom = sectors[from]!;
      for (let to = 0; to < n; to++) {
        if (inTree.has(to)) continue;
        const d = dist(sFrom, sectors[to]!);
        if (d < bestDist) {
          bestDist = d;
          bestFrom = from;
          bestTo = to;
        }
      }
    }

    if (bestTo === -1) break; // shouldn't happen
    addConnection(bestFrom, bestTo);
    inTree.add(bestTo);
  }

  // ── Step 2: Add extra connections ──
  // Compute how many more we need for target average degree
  const targetTotal = n * targetAvgDegree;
  const currentTotal = connections.length * 2; // each edge counts for 2
  let extraNeeded = Math.max(0, Math.floor((targetTotal - currentTotal) / 2));

  // Build candidate list: nearby sector pairs not yet connected
  const candidates: { from: number; to: number; dist: number }[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const key = `${i}-${j}`;
      if (connectionSet.has(key)) continue;
      candidates.push({
        from: i,
        to: j,
        dist: dist(sectors[i]!, sectors[j]!),
      });
    }
  }

  // Sort by distance (prefer connecting nearby sectors)
  candidates.sort((a, b) => a.dist - b.dist);

  // Take candidates, biased toward shorter distances
  for (const cand of candidates) {
    if (extraNeeded <= 0) break;

    const fromDegree = getDegree(cand.from);
    const toDegree = getDegree(cand.to);

    // Skip if either sector already has many connections
    if (fromDegree >= 5 || toDegree >= 5) continue;

    // FedSpace sectors get more connections (hub-like)
    const isFedFrom = fedSpaceIds.includes(cand.from);
    const isFedTo = fedSpaceIds.includes(cand.to);

    // Probability: higher for close sectors and FedSpace hubs
    const maxDist = Math.sqrt(n) * 2;
    const distFactor = 1 - (cand.dist / maxDist);
    const hubBonus = (isFedFrom || isFedTo) ? 0.3 : 0;
    const probability = Math.min(0.8, distFactor * 0.6 + hubBonus);

    if (rng.chance(probability)) {
      addConnection(cand.from, cand.to);
      extraNeeded--;
    }
  }

  return connections;
}

/**
 * Verify all sectors are reachable via BFS from any sector.
 * Returns the set of reachable sector IDs from sector 0.
 */
export function verifyConnectivity(
  sectorCount: number,
  connections: LayoutConnection[],
): { connected: boolean; reachable: Set<number> } {
  const adj = new Map<number, number[]>();
  for (let i = 0; i < sectorCount; i++) adj.set(i, []);

  for (const conn of connections) {
    adj.get(conn.from)!.push(conn.to);
    adj.get(conn.to)!.push(conn.from);
  }

  const visited = new Set<number>();
  const queue = [0];
  visited.add(0);

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const neighbor of adj.get(current) ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return { connected: visited.size === sectorCount, reachable: visited };
}
