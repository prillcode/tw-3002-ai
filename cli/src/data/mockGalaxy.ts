/**
 * Mock galaxy data for testing sector navigation.
 * Defines sectors, ports, connections, and danger levels.
 * Will be replaced with SQLite persistence in Phase 6.
 */

export interface Port {
  /** Port class (I=best, II=medium, III=worst) */
  class: 'I' | 'II' | 'III';
  /** What commodity this port trades */
  type: 'Ore' | 'Organics' | 'Equipment';
  /** True = port buys this type, False = port sells */
  buying: boolean;
}

export interface Sector {
  id: number;
  name: string;
  port?: Port;
  /** Safety level of sector */
  danger: 'safe' | 'caution' | 'dangerous';
  /** Connected sector IDs */
  neighbors: number[];
  /** NPC ships present (count) */
  npcs?: number;
}

/** Mock galaxy with 10 connected sectors */
export const mockSectors: Sector[] = [
  {
    id: 42,
    name: "FedSpace Alpha",
    port: {class: 'II', type: 'Ore', buying: false},
    danger: 'safe',
    neighbors: [41, 43, 52],
    npcs: 2
  },
  {
    id: 41,
    name: "Mining Outpost 7",
    port: {class: 'II', type: 'Ore', buying: true},
    danger: 'safe',
    neighbors: [40, 42, 51],
    npcs: 1
  },
  {
    id: 43,
    name: "AgriStation Gamma",
    port: {class: 'I', type: 'Organics', buying: true},
    danger: 'safe',
    neighbors: [42, 44, 53],
    npcs: 3
  },
  {
    id: 52,
    name: "Deep Space Void",
    danger: 'dangerous',
    neighbors: [42, 51, 62],
    npcs: 0
  },
  {
    id: 40,
    name: "Industrial Complex",
    port: {class: 'III', type: 'Equipment', buying: true},
    danger: 'caution',
    neighbors: [30, 41, 50],
    npcs: 2
  },
  {
    id: 51,
    name: "Pirate Haven",
    danger: 'dangerous',
    neighbors: [41, 52, 61],
    npcs: 4
  },
  {
    id: 44,
    name: "TerraForm Station",
    port: {class: 'I', type: 'Organics', buying: false},
    danger: 'safe',
    neighbors: [43, 45, 54],
    npcs: 1
  },
  {
    id: 53,
    name: "Asteroid Belt",
    danger: 'caution',
    neighbors: [43, 54, 63],
    npcs: 2
  },
  {
    id: 62,
    name: "The Outer Rim",
    danger: 'dangerous',
    neighbors: [52, 61, 72],
    npcs: 1
  },
  {
    id: 30,
    name: "StarDock Prime",
    port: {class: 'I', type: 'Equipment', buying: false},
    danger: 'safe',
    neighbors: [20, 40, 31],
    npcs: 5
  }
];

/** Get sector by ID */
export const getSector = (id: number): Sector | undefined => {
  return mockSectors.find(s => s.id === id);
};

/** Get all neighbors of a sector */
export const getNeighbors = (sectorId: number): Sector[] => {
  const sector = getSector(sectorId);
  if (!sector) return [];
  return sector.neighbors.map(id => getSector(id)).filter((s): s is Sector => s !== undefined);
};
