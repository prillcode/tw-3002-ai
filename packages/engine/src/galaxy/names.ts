/**
 * Procedural name generation for sectors, ports, and regions.
 * Uses a seeded RNG for reproducibility.
 */
import { SeededRandom } from '../rng.js';

// ─── Sector Names ──────────────────────────────────────────

const SECTOR_PREFIXES = [
  'Kepler', 'Vega', 'Orion', 'Lyra', 'Draco', 'Cygnus', 'Andra', 'Rigel',
  'Altair', 'Sirius', 'Polaris', 'Antares', 'Betelgeuse', 'Capella', 'Deneb',
  'Arcturus', 'Procyon', 'Achernar', 'Canopus', 'Fomalhaut', 'Mira', 'Aldebaran',
  'Spica', 'Regulus', 'Castor', 'Pollux', 'Algol', 'Bellatrix', 'Mintaka',
  'Alnilam', 'Alnitak', 'Saiph', 'Elnath', 'Merak', 'Dubhe', 'Alioth',
  'Kochab', 'Schedar', 'Mirfak', 'Hamal', 'Menkar', 'Diphda', 'Ankaa',
] as const;

const SECTOR_SUFFIXES = [
  'Station', 'Outpost', 'Colony', 'Relay', 'Hub', 'Terminal', 'Beacon',
  'Crossroads', 'Junction', 'Nexus', 'Waypoint', 'Depot', 'Refuge',
  'Harbor', 'Gate', 'Watch', 'Reach', 'Drift', 'Point', 'Mark',
] as const;

const SECTOR_LONE_NAMES = [
  'FedSpace Alpha', 'FedSpace Beta', 'FedSpace Gamma', 'StarDock Prime',
  'The Void', 'Deep Space', 'The Maw', 'Ghost Sector', 'Null Point',
  'The Rim', 'Dead End', 'Nowhere', 'The Abyss', 'Last Stop',
] as const;

// ─── Region Names ──────────────────────────────────────────

const REGION_NAMES = [
  'The Core', 'Inner Reach', 'Midward Expanse', 'Outer Colonies',
  'Pirate Alleys', 'The Fringe', 'Dust Belt', 'Azure Expanse',
  'Crimson Void', 'Emerald Drift', 'Iron Nebula', 'Shadow Marches',
  'Solar Heights', 'Obsidian Deep', 'Titan Rift',
] as const;

// ─── Port Names ────────────────────────────────────────────

const PORT_PREFIXES = [
  'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta',
  'Nova', 'Sol', 'Luna', 'Terra', 'Helios', 'Astra', 'Primus', 'Secundus',
  'Meridian', 'Zenith', 'Nadir', 'Apex', 'Quasar', 'Pulsar', 'Nebula',
  'Corsair', 'Vanguard', 'Sentinel', 'Haven', 'Crucible', 'Forge',
  'Harvest', 'Exchange',
] as const;

const PORT_SUFFIXES_BY_CLASS: Record<number, readonly string[]> = {
  1: ['Prime', 'Central', 'Grand', 'Royal', 'Sovereign', 'Capital'] as const,
  2: ['Outpost', 'Station', 'Terminal', 'Dock', 'Market'] as const,
  3: ['Depot', 'Cache', 'Stop', 'Cache', 'Shed', 'Dump'] as const,
};

export interface NameGenerator {
  sectorName(rng: SeededRandom): string;
  portName(rng: SeededRandom, portClass: 1 | 2 | 3): string;
  regionName(index: number): string;
  loneName(rng: SeededRandom): string;
}

/** Create a name generator with optional custom pools (for testing) */
export function createNameGenerator(): NameGenerator {
  const usedSectorNames = new Set<string>();
  const usedPortNames = new Set<string>();

  return {
    sectorName(rng: SeededRandom): string {
      let name: string;
      let attempts = 0;
      do {
        const prefix = rng.pick(SECTOR_PREFIXES);
        const suffix = rng.pick(SECTOR_SUFFIXES);
        name = `${prefix} ${suffix}`;
        attempts++;
        if (attempts > 100) {
          // Fallback: add a number to guarantee uniqueness
          name = `${prefix} ${suffix} ${usedSectorNames.size + 1}`;
          break;
        }
      } while (usedSectorNames.has(name));
      usedSectorNames.add(name);
      return name;
    },

    portName(rng: SeededRandom, portClass: 1 | 2 | 3): string {
      let name: string;
      let attempts = 0;
      const suffixes = PORT_SUFFIXES_BY_CLASS[portClass] ?? PORT_SUFFIXES_BY_CLASS[2]!;
      do {
        const prefix = rng.pick(PORT_PREFIXES);
        const suffix = rng.pick(suffixes);
        name = `${prefix} ${suffix}`;
        attempts++;
        if (attempts > 100) {
          name = `${prefix} ${suffix} ${usedPortNames.size + 1}`;
          break;
        }
      } while (usedPortNames.has(name));
      usedPortNames.add(name);
      return name;
    },

    regionName(index: number): string {
      return REGION_NAMES[index % REGION_NAMES.length]!;
    },

    loneName(rng: SeededRandom): string {
      return rng.pick(SECTOR_LONE_NAMES);
    },
  };
}
