/**
 * NPC generator — creates a population of NPCs for a galaxy.
 */
import type { Galaxy } from '../types.js';
import type { NPC, NPCType, NPCPersona } from './types.js';
import { SeededRandom } from '../rng.js';

const NPC_NAME_PREFIXES = [
  'Zed', 'Kira', 'Jax', 'Vex', 'Nora', 'Milo', 'Rex', 'Luna',
  'Crix', 'Tara', 'Finn', 'Vera', 'Oren', 'Iris', 'Dax', 'Yara',
  'Bolt', 'Sera', 'Grek', 'Mina', 'Rook', 'Zara', 'Kael', 'Juno',
];

const NPC_NAME_SUFFIXES = [
  'the Trader', 'Voidwalker', 'Starhand', 'Quickfingers',
  'Ironheart', 'Shadow', 'Brighteye', 'Deepspace',
  'the Bold', 'Windsailor', 'Firebrand', 'Icevein',
  'the Cunning', 'Goldseeker', 'Dustrunner', 'Neonblade',
];

const TRADER_FLAVORS = [
  'Cautious merchant who avoids conflict',
  'Opportunistic trader seeking quick profits',
  'Honest dealer with a reputation to protect',
  'Shrewd negotiator who never pays full price',
  'Nomadic peddler who goes where the deals are',
];

const RAIDER_FLAVORS = [
  'Bloodthirsty pirate who attacks on sight',
  'Calculating raider who sizes up prey first',
  'Desperate outlaw running from debts',
  'Opportunistic thief who hits weak targets',
  'Vengeful renegade with a grudge against traders',
];

const PATROL_FLAVORS = [
  'Steadfast enforcer of FedSpace law',
  'Veteran patrol officer nearing retirement',
  'Young idealist who believes in order',
  'Pragmatic peacekeeper who picks battles',
];

function generateName(rng: SeededRandom): string {
  return `${rng.pick(NPC_NAME_PREFIXES)} ${rng.pick(NPC_NAME_SUFFIXES)}`;
}

function createPersona(type: NPCType, rng: SeededRandom): NPCPersona {
  const name = generateName(rng);

  switch (type) {
    case 'trader':
      return {
        type,
        name,
        aggression: rng.nextFloat(0.05, 0.25),
        caution: rng.nextFloat(0.5, 0.9),
        greed: rng.nextFloat(0.4, 0.9),
        loyalty: rng.nextFloat(0.3, 0.7),
        flavor: rng.pick(TRADER_FLAVORS),
      };
    case 'raider':
      return {
        type,
        name,
        aggression: rng.nextFloat(0.6, 0.95),
        caution: rng.nextFloat(0.1, 0.5),
        greed: rng.nextFloat(0.5, 0.9),
        loyalty: rng.nextFloat(0.1, 0.4),
        flavor: rng.pick(RAIDER_FLAVORS),
      };
    case 'patrol':
      return {
        type,
        name,
        aggression: rng.nextFloat(0.3, 0.7),
        caution: rng.nextFloat(0.4, 0.8),
        greed: rng.nextFloat(0.1, 0.3),
        loyalty: rng.nextFloat(0.6, 1.0),
        flavor: rng.pick(PATROL_FLAVORS),
      };
  }
}

function createShip(type: NPCType, rng: SeededRandom) {
  switch (type) {
    case 'trader':
      return {
        name: '', // filled by persona
        hull: Math.round(rng.nextFloat(60, 100)),
        maxHull: 100,
        shield: Math.round(rng.nextFloat(5, 20)),
        maxShield: 20,
        weaponDamage: Math.round(rng.nextFloat(4, 8)),
        dodgeChance: rng.nextFloat(0.05, 0.12),
        credits: Math.round(rng.nextFloat(2000, 8000)),
      };
    case 'raider':
      return {
        name: '',
        hull: Math.round(rng.nextFloat(70, 120)),
        maxHull: 120,
        shield: Math.round(rng.nextFloat(10, 30)),
        maxShield: 30,
        weaponDamage: Math.round(rng.nextFloat(8, 16)),
        dodgeChance: rng.nextFloat(0.08, 0.15),
        credits: Math.round(rng.nextFloat(500, 3000)),
      };
    case 'patrol':
      return {
        name: '',
        hull: Math.round(rng.nextFloat(90, 140)),
        maxHull: 140,
        shield: Math.round(rng.nextFloat(20, 40)),
        maxShield: 40,
        weaponDamage: Math.round(rng.nextFloat(6, 12)),
        dodgeChance: rng.nextFloat(0.06, 0.12),
        credits: Math.round(rng.nextFloat(1000, 5000)),
      };
  }
}

function startingCargo(type: NPCType, rng: SeededRandom): Record<string, number> {
  if (type === 'trader') {
    return {
      ore: rng.nextInt(0, 30),
      organics: rng.nextInt(0, 30),
      equipment: rng.nextInt(0, 15),
    };
  }
  return { ore: 0, organics: 0, equipment: 0 };
}

/**
 * Generate a population of NPCs for a galaxy.
 */
export function generateNPCs(galaxy: Galaxy, count: number = 20, seed?: number): NPC[] {
  const rng = new SeededRandom(seed ?? Date.now());
  const npcs: NPC[] = [];

  const sectorIds = Array.from(galaxy.sectors.keys());

  // Type distribution
  const types: NPCType[] = [];
  for (let i = 0; i < count; i++) {
    const roll = rng.next();
    if (roll < 0.5) types.push('trader');
    else if (roll < 0.8) types.push('raider');
    else types.push('patrol');
  }

  for (let i = 0; i < count; i++) {
    const type = types[i]!;
    const persona = createPersona(type, rng.fork());
    const ship = createShip(type, rng.fork());
    ship.name = persona.name;

    // Placement bias
    let sectorId: number;
    if (type === 'patrol') {
      // Near FedSpace
      const fedAdjacent = [...galaxy.fedSpace];
      for (const fs of galaxy.fedSpace) {
        for (const conn of galaxy.connections) {
          if (conn.from === fs) fedAdjacent.push(conn.to);
          if (conn.to === fs) fedAdjacent.push(conn.from);
        }
      }
      sectorId = rng.pick(fedAdjacent);
    } else if (type === 'raider') {
      // Dangerous sectors
      const dangerous = sectorIds.filter(id => galaxy.sectors.get(id)?.danger === 'dangerous');
      sectorId = dangerous.length > 0 ? rng.pick(dangerous) : rng.pick(sectorIds);
    } else {
      // Traders anywhere with ports
      const withPorts = sectorIds.filter(id => galaxy.sectors.get(id)?.port);
      sectorId = withPorts.length > 0 ? rng.pick(withPorts) : rng.pick(sectorIds);
    }

    npcs.push({
      id: `npc-${i}-${rng.nextInt(1000, 9999)}`,
      persona,
      ship,
      currentSectorId: sectorId,
      credits: ship.credits,
      cargo: startingCargo(type, rng.fork()),
      memory: {
        lastActions: [],
        grudges: [],
        alliances: [],
        marketObservations: [],
        reputation: {},
      },
      isActive: false,
      turnsSinceSpawn: 0,
    });
  }

  return npcs;
}
