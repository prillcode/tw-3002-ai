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

// Market data types
export type CommodityType = 'ore' | 'organics' | 'equipment';

export interface MarketData {
  commodity: CommodityType;
  label: string;
  buyPrice: number;    // Price player pays to buy from port
  sellPrice: number;   // Price player gets for selling to port
  portStock: number;
}

// Base prices by commodity
const basePrices: Record<CommodityType, number> = {
  ore: 100,
  organics: 50,
  equipment: 200
};

// Port class multipliers (affects spread)
const classMultipliers: Record<'I' | 'II' | 'III', number> = {
  'I': 0.05,   // 5% - best prices, tightest spread
  'II': 0.10,  // 10%
  'III': 0.15  // 15% - worst prices, widest spread
};

/** Generate market data for a port */
export const getMarketData = (port: Port): MarketData[] => {
  const multiplier = classMultipliers[port.class];
  
  // Generate prices for all commodities
  const commodities: CommodityType[] = ['ore', 'organics', 'equipment'];
  
  return commodities.map(commodity => {
    const base = basePrices[commodity];
    const isSpecialist = port.type === 
      (commodity === 'ore' ? 'Ore' : 
       commodity === 'organics' ? 'Organics' : 'Equipment');
    
    // Specialist ports have better prices for their type
    let buyPrice: number;
    let sellPrice: number;
    
    if (isSpecialist) {
      // Specialist: buying = cheaper for player (they want it), selling = cheaper for player (they sell bulk)
      buyPrice = Math.round(base * (1 - multiplier * 1.5));  // Good deal buying
      sellPrice = Math.round(base * (1 - multiplier));       // Good deal selling
    } else {
      // Non-specialist: standard markup
      buyPrice = Math.round(base * (1 + multiplier));
      sellPrice = Math.round(base * (1 - multiplier * 0.5));
    }
    
    // Port inventory varies by type and class
    const portStock = port.class === 'I' ? 1000 : port.class === 'II' ? 500 : 250;
    
    return {
      commodity,
      label: commodity.charAt(0).toUpperCase() + commodity.slice(1),
      buyPrice,
      sellPrice,
      portStock
    };
  });
};
