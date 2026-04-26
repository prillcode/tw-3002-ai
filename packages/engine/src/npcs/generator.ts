/**
 * NPC generator — creates a population of NPCs for a galaxy.
 * Factions: CHOAM, Fremen, Sardaukar, Guild, Independent
 * Reference: lore-reference/UNIVERSE-BIBLE.md
 */
import type { Galaxy } from '../types.js';
import type { NPC, NPCType, NPCFaction, NPCPersona } from './types.js';
import { SeededRandom } from '../rng.js';

// ─── Faction-specific name pools ────────────────────────────────────

const FREMEN_PREFIXES = [
  'Chani', 'Stilgar', 'Jamis', 'Otheym', 'Farok', 'Shishakli', 'Muriz',
  'Namri', 'Shoab', 'Ali', 'Turok', 'Rinya', 'Korba', 'Bijaz', 'Lichna',
  'Sabriha', 'Warrick', 'Tansho', 'Murbell', 'Zaal',
];

const FREMEN_SUFFIXES = [
  'the Knife', 'Sandrider', 'Dune Walker', 'Sietch Keeper', 'Worm Rider',
  'Deep Desert', 'Maker Finder', 'Stillman', 'Crysknife', 'Shai-Hulud\'s Eye',
  'Dust Devil', 'Tent Fighter', 'Windborn', 'Raven of the Sands',
];

const SARDAUKAR_PREFIXES = [
  'Aramsham', 'Tyekanik', 'Bashar', 'Cando', 'Kryubi', 'Iakin', 'Nefud',
  'Farok', 'Saag', 'Denik', 'Batrek', 'Shishakli', 'Kronin', 'Valduz',
  'Goruda', 'Malak', 'Shazar', 'Dragan', 'Kordac', 'Torval',
];

const SARDAUKAR_SUFFIXES = [
  'Iron Fist', 'the Hammer', 'Breaker', 'Siege Lord', 'the Flayer',
  'Black Blade', 'War Priest', 'the Butcher', 'Grave Maker', 'Steel Fang',
  'Thane of Ash', 'the Scourge', 'Battleborn', 'Fist of Fire',
];

const CHOAM_PREFIXES = [
  'Vries', 'Margot', 'Fenring', 'Shaddam', 'Wensicia', 'Irulan', 'Bannerjee',
  'Alkando', 'Syaksa', 'Zolta', 'Brigmon', 'Tandis', 'Palymbris', 'Kallee',
  'Bridgeman', 'Caventa', 'Grechman', 'Dwyrin', 'Halleck', 'Moritani',
];

const CHOAM_SUFFIXES = [
  'Trade Commissioner', 'Guild Officer', 'Factor', 'Legate', 'Emissary',
  'Attaché', 'Quartermaster', 'Port Warden', 'Customs Chief', 'Trade Adjutant',
];

const INDEPENDENT_PREFIXES = [
  'Zed', 'Kira', 'Jax', 'Vex', 'Nora', 'Milo', 'Rex', 'Luna',
  'Crix', 'Tara', 'Finn', 'Vera', 'Oren', 'Iris', 'Dax', 'Yara',
  'Bolt', 'Sera', 'Grek', 'Mina', 'Rook', 'Zara', 'Kael', 'Juno',
];

const INDEPENDENT_SUFFIXES = [
  'the Trader', 'Voidwalker', 'Starhand', 'Quickfingers',
  'Ironheart', 'Shadow', 'Brighteye', 'Deepspace',
  'the Bold', 'Windsailor', 'Firebrand', 'Icevein',
  'the Cunning', 'Goldseeker', 'Dustrunner', 'Neonblade',
];

// ─── Faction flavors ─────────────────────────────────────────────────

const FREMEN_FLAVORS = [
  'Fierce desert warrior defending ancestral territory',
  'Territorial scout who tolls travelers through the deep sectors',
  'Battle-hardened warrior who fights with crysknife precision',
  'Sentry watching the space lanes for Sardaukar incursions',
  'Nomadic fighter who knows the hidden warp routes',
];

const SARDAUKAR_FLAVORS = [
  'Brutal enforcer who attacks all on sight without mercy',
  'Elite warrior forged in hell, relentless in pursuit',
  'Disciplined killer who never retreats and never negotiates',
  'Ruthless raider who strips sectors of all value',
  'Iron-fisted soldier who answers only to the chain of command',
];

const CHOAM_FLAVORS = [
  'Steadfast enforcer of CHOAM trade regulations',
  'Veteran patrol officer maintaining order in the trade lanes',
  'Pragmatic peacekeeper who defends Guild interests',
  'Dedicated sentinel guarding CHOAM Protected Space',
];

const INDEPENDENT_FLAVORS = [
  'Cautious merchant who avoids conflict at all costs',
  'Opportunistic trader seeking quick profits',
  'Honest dealer with a reputation to protect',
  'Shrewd negotiator who never pays full price',
  'Nomadic peddler who goes where the deals are',
];

// ─── Faction assignment ──────────────────────────────────────────────

function factionForType(type: NPCType, rng: SeededRandom): NPCFaction {
  switch (type) {
    case 'trader':
      return rng.next() < 0.7 ? 'independent' : 'choam';
    case 'raider': {
      const roll = rng.next();
      if (roll < 0.55) return 'fremen';
      return 'sardaukar';
    }
    case 'patrol':
      return rng.next() < 0.8 ? 'choam' : 'guild';
  }
}

function generateFactionName(faction: NPCFaction, rng: SeededRandom): string {
  switch (faction) {
    case 'fremen':
      return `${rng.pick(FREMEN_PREFIXES)} ${rng.pick(FREMEN_SUFFIXES)}`;
    case 'sardaukar':
      return `${rng.pick(SARDAUKAR_PREFIXES)} ${rng.pick(SARDAUKAR_SUFFIXES)}`;
    case 'choam':
    case 'guild':
      return `${rng.pick(CHOAM_PREFIXES)} ${rng.pick(CHOAM_SUFFIXES)}`;
    case 'independent':
      return `${rng.pick(INDEPENDENT_PREFIXES)} ${rng.pick(INDEPENDENT_SUFFIXES)}`;
  }
}

function createPersona(type: NPCType, rng: SeededRandom): NPCPersona {
  const faction = factionForType(type, rng);
  const name = generateFactionName(faction, rng);

  switch (type) {
    case 'trader':
      return {
        type,
        faction,
        name,
        aggression: rng.nextFloat(0.05, 0.25),
        caution: rng.nextFloat(0.5, 0.9),
        greed: rng.nextFloat(0.4, 0.9),
        loyalty: rng.nextFloat(0.3, 0.7),
        flavor: faction === 'choam'
          ? rng.pick(CHOAM_FLAVORS)
          : rng.pick(INDEPENDENT_FLAVORS),
      };
    case 'raider':
      return {
        type,
        faction,
        name,
        aggression: faction === 'sardaukar'
          ? rng.nextFloat(0.8, 1.0)
          : rng.nextFloat(0.6, 0.85),
        caution: faction === 'sardaukar'
          ? rng.nextFloat(0.05, 0.2)
          : rng.nextFloat(0.3, 0.6),
        greed: faction === 'sardaukar'
          ? rng.nextFloat(0.5, 0.8)
          : rng.nextFloat(0.2, 0.5),
        loyalty: rng.nextFloat(0.1, 0.4),
        flavor: faction === 'sardaukar'
          ? rng.pick(SARDAUKAR_FLAVORS)
          : rng.pick(FREMEN_FLAVORS),
      };
    case 'patrol':
      return {
        type,
        faction,
        name,
        aggression: rng.nextFloat(0.3, 0.7),
        caution: rng.nextFloat(0.4, 0.8),
        greed: rng.nextFloat(0.1, 0.3),
        loyalty: rng.nextFloat(0.6, 1.0),
        flavor: rng.pick(CHOAM_FLAVORS),
      };
  }
}

function createShip(type: NPCType, rng: SeededRandom) {
  switch (type) {
    case 'trader':
      return {
        name: '',
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

    // Placement bias by faction
    let sectorId: number;
    if (type === 'patrol') {
      const fedAdjacent = [...galaxy.fedSpace];
      for (const fs of galaxy.fedSpace) {
        for (const conn of galaxy.connections) {
          if (conn.from === fs) fedAdjacent.push(conn.to);
          if (conn.to === fs) fedAdjacent.push(conn.from);
        }
      }
      sectorId = rng.pick(fedAdjacent);
    } else if (persona.faction === 'fremen') {
      // Fremen prefer dangerous sectors
      const dangerous = sectorIds.filter(id => galaxy.sectors.get(id)?.danger === 'dangerous');
      sectorId = dangerous.length > 0 ? rng.pick(dangerous) : rng.pick(sectorIds);
    } else if (persona.faction === 'sardaukar') {
      // Sardaukar go anywhere that's not safe
      const hostile = sectorIds.filter(id => galaxy.sectors.get(id)?.danger !== 'safe');
      sectorId = hostile.length > 0 ? rng.pick(hostile) : rng.pick(sectorIds);
    } else {
      // Traders near ports
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
