export interface Upgrade {
  id: string;
  name: string;
  description: string;
  category: 'engines' | 'shields' | 'weapons' | 'cargo' | 'hull';
  tier: number;
  cost: number;
  effect: Partial<{
    maxCargo: number;
    maxHull: number;
    maxTurns: number;
    baseTurnCost: number;
    combatBonus: number;
    dodgeChance: number;
    shieldPoints: number;
  }>;
  prerequisite: string | null;
}

export const UPGRADE_CATALOG: Upgrade[] = [
  { id: 'cargo-1', name: 'Cargo Holds Mk I', description: '+30 cargo capacity', category: 'cargo', tier: 1, cost: 2000, effect: { maxCargo: 30 }, prerequisite: null },
  { id: 'cargo-2', name: 'Cargo Holds Mk II', description: '+40 cargo capacity', category: 'cargo', tier: 2, cost: 5000, effect: { maxCargo: 40 }, prerequisite: 'cargo-1' },
  { id: 'cargo-3', name: 'Cargo Holds Mk III', description: '+50 cargo capacity', category: 'cargo', tier: 3, cost: 12000, effect: { maxCargo: 50 }, prerequisite: 'cargo-2' },
  { id: 'engines-1', name: 'Ion Engines Mk I', description: '+5% dodge chance', category: 'engines', tier: 1, cost: 3000, effect: { dodgeChance: 0.05 }, prerequisite: null },
  { id: 'engines-2', name: 'Ion Engines Mk II', description: '+5% dodge, warp efficiency', category: 'engines', tier: 2, cost: 8000, effect: { dodgeChance: 0.05, baseTurnCost: -1 }, prerequisite: 'engines-1' },
  { id: 'engines-3', name: 'Ion Engines Mk III', description: '+10% dodge, warp efficiency', category: 'engines', tier: 3, cost: 15000, effect: { dodgeChance: 0.10, baseTurnCost: -1 }, prerequisite: 'engines-2' },
  { id: 'hull-1', name: 'Hull Plating Mk I', description: '+20 max hull integrity', category: 'hull', tier: 1, cost: 2500, effect: { maxHull: 20 }, prerequisite: null },
  { id: 'hull-2', name: 'Hull Plating Mk II', description: '+30 max hull integrity', category: 'hull', tier: 2, cost: 6000, effect: { maxHull: 30 }, prerequisite: 'hull-1' },
  { id: 'hull-3', name: 'Hull Plating Mk III', description: '+50 max hull integrity', category: 'hull', tier: 3, cost: 12000, effect: { maxHull: 50 }, prerequisite: 'hull-2' },
  { id: 'shields-1', name: 'Deflector Shields Mk I', description: '+15 shield points', category: 'shields', tier: 1, cost: 4000, effect: { shieldPoints: 15 }, prerequisite: null },
  { id: 'shields-2', name: 'Deflector Shields Mk II', description: '+25 shield points', category: 'shields', tier: 2, cost: 10000, effect: { shieldPoints: 25 }, prerequisite: 'shields-1' },
  { id: 'shields-3', name: 'Deflector Shields Mk III', description: '+40 shield points', category: 'shields', tier: 3, cost: 20000, effect: { shieldPoints: 40 }, prerequisite: 'shields-2' },
  { id: 'weapons-1', name: 'Pulse Lasers Mk I', description: '+5 combat damage', category: 'weapons', tier: 1, cost: 3500, effect: { combatBonus: 5 }, prerequisite: null },
  { id: 'weapons-2', name: 'Pulse Lasers Mk II', description: '+10 combat damage', category: 'weapons', tier: 2, cost: 9000, effect: { combatBonus: 10 }, prerequisite: 'weapons-1' },
  { id: 'weapons-3', name: 'Pulse Lasers Mk III', description: '+15 combat damage', category: 'weapons', tier: 3, cost: 18000, effect: { combatBonus: 15 }, prerequisite: 'weapons-2' },
];

export function getAvailableUpgrades(owned: Record<string, number>): Upgrade[] {
  return UPGRADE_CATALOG.filter(u => {
    if (owned[u.id]) return false;
    if (u.prerequisite && !owned[u.prerequisite]) return false;
    return true;
  });
}

export function getOwnedUpgrades(owned: Record<string, number>): Upgrade[] {
  return UPGRADE_CATALOG.filter(u => owned[u.id]);
}
