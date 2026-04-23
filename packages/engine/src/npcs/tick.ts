/**
 * NPC tick system — processes active NPC turns when player logs in.
 * Dormant galaxy: only NPCs within a radius of the player wake up.
 */
import type { GameStateContainer } from '../state/GameStateContainer.js';
import type { LLMConfig } from '../llm/provider.js';
import type { NPC, NewsItem } from './types.js';
import type { Galaxy } from '../types.js';
import { decideAction, executeNPCAction } from './brain.js';
import { decayMemory } from './memory.js';
import { SeededRandom } from '../rng.js';

export interface TickStats {
  npcsProcessed: number;
  actionsTaken: number;
  llmCalls: number;
  llmCost: number;
  durationMs: number;
}

// ── NPC-to-NPC Combat ──────────────────────────────────────

function resolveNPCCombat(attacker: NPC, defender: NPC): { attacker: NPC; defender: NPC; news: NewsItem } {
  const now = new Date().toISOString();
  const a = { ...attacker, ship: { ...attacker.ship } };
  const d = { ...defender, ship: { ...defender.ship } };

  // 3 rounds max, simplified dice rolls
  for (let round = 0; round < 3; round++) {
    // Attacker hits defender
    const aDmg = a.ship.weaponDamage * (0.8 + Math.random() * 0.4);
    const aShieldAbsorb = Math.min(d.ship.shield, aDmg * 0.5);
    d.ship.shield = Math.max(0, d.ship.shield - aShieldAbsorb);
    d.ship.hull = Math.max(0, d.ship.hull - (aDmg - aShieldAbsorb));

    if (d.ship.hull <= 0) break;

    // Defender hits attacker
    const dDmg = d.ship.weaponDamage * (0.8 + Math.random() * 0.4);
    const dShieldAbsorb = Math.min(a.ship.shield, dDmg * 0.5);
    a.ship.shield = Math.max(0, a.ship.shield - dShieldAbsorb);
    a.ship.hull = Math.max(0, a.ship.hull - (dDmg - dShieldAbsorb));

    if (a.ship.hull <= 0) break;
  }

  const aAlive = a.ship.hull > 0;
  const dAlive = d.ship.hull > 0;

  let headline: string;
  let winner: NPC | null = null;
  let loser: NPC | null = null;

  if (aAlive && !dAlive) {
    headline = `${a.persona.name} destroyed ${d.persona.name}`;
    winner = a;
    loser = d;
  } else if (!aAlive && dAlive) {
    headline = `${d.persona.name} defeated ${a.persona.name}`;
    winner = d;
    loser = a;
  } else if (!aAlive && !dAlive) {
    headline = `${a.persona.name} and ${d.persona.name} destroyed each other`;
  } else {
    headline = `${a.persona.name} and ${d.persona.name} fought to a standstill`;
  }

  // Winner loots loser
  if (winner && loser) {
    const loot = Math.min(loser.credits, Math.round(loser.credits * 0.5));
    winner.credits += loot;
    loser.credits -= loot;

    // Winner also takes some cargo
    for (const [comm, amt] of Object.entries(loser.cargo)) {
      if (amt > 0) {
        const take = Math.min(amt, 5);
        winner.cargo[comm as keyof typeof winner.cargo] = (winner.cargo[comm as keyof typeof winner.cargo] ?? 0) + take;
        loser.cargo[comm as keyof typeof loser.cargo] = amt - take;
      }
    }
  }

  return {
    attacker: a,
    defender: d,
    news: {
      timestamp: now,
      headline,
      type: 'combat',
      sectorId: attacker.currentSectorId,
    },
  };
}

// ── Respawn ────────────────────────────────────────────────

function respawnDestroyedNPCs(npcs: NPC[], galaxy: Galaxy, seed: number): NPC[] {
  const alive = npcs.filter(n => n.ship.hull > 0 && n.isActive);
  const destroyed = npcs.filter(n => n.ship.hull <= 0 || !n.isActive);
  if (destroyed.length === 0) return npcs;

  const rng = new SeededRandom(seed);
  const sectorIds = Array.from(galaxy.sectors.keys());
  const newNPCs: NPC[] = [];

  for (let i = 0; i < destroyed.length; i++) {
    const typeRoll = rng.next();
    const type: NPC['persona']['type'] = typeRoll < 0.5 ? 'trader' : typeRoll < 0.8 ? 'raider' : 'patrol';

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
    } else if (type === 'raider') {
      const dangerous = sectorIds.filter(id => galaxy.sectors.get(id)?.danger === 'dangerous');
      sectorId = dangerous.length > 0 ? rng.pick(dangerous) : rng.pick(sectorIds);
    } else {
      const withPorts = sectorIds.filter(id => galaxy.sectors.get(id)?.port);
      sectorId = withPorts.length > 0 ? rng.pick(withPorts) : rng.pick(sectorIds);
    }

    const hull = type === 'trader' ? rng.nextInt(60, 100) : type === 'raider' ? rng.nextInt(70, 120) : rng.nextInt(90, 140);
    const maxHull = type === 'trader' ? 100 : type === 'raider' ? 120 : 140;
    const shield = type === 'trader' ? rng.nextInt(5, 20) : type === 'raider' ? rng.nextInt(10, 30) : rng.nextInt(20, 40);
    const maxShield = type === 'trader' ? 20 : type === 'raider' ? 30 : 40;
    const weapon = type === 'trader' ? rng.nextInt(4, 8) : type === 'raider' ? rng.nextInt(8, 16) : rng.nextInt(6, 12);
    const dodge = type === 'trader' ? rng.nextFloat(0.05, 0.12) : type === 'raider' ? rng.nextFloat(0.08, 0.15) : rng.nextFloat(0.06, 0.12);
    const credits = type === 'trader' ? rng.nextInt(2000, 8000) : type === 'raider' ? rng.nextInt(500, 3000) : rng.nextInt(1000, 5000);

    const namePrefixes = ['Zed','Kira','Jax','Vex','Nora','Milo','Rex','Luna','Crix','Tara','Finn','Vera','Oren','Iris','Dax','Yara','Bolt','Sera','Grek','Mina','Rook','Zara','Kael','Juno'];
    const nameSuffixes = ['the Trader','Voidwalker','Starhand','Quickfingers','Ironheart','Shadow','Brighteye','Deepspace','the Bold','Windsailor','Firebrand','Icevein','the Cunning','Goldseeker','Dustrunner','Neonblade'];

    const cargo = type === 'trader'
      ? { ore: rng.nextInt(0, 30), organics: rng.nextInt(0, 30), equipment: rng.nextInt(0, 15) }
      : { ore: 0, organics: 0, equipment: 0 };

    newNPCs.push({
      id: `npc-${Date.now()}-${i}-${rng.nextInt(1000, 9999)}`,
      persona: {
        type,
        name: `${rng.pick(namePrefixes)} ${rng.pick(nameSuffixes)}`,
        aggression: type === 'trader' ? rng.nextFloat(0.05, 0.25) : type === 'raider' ? rng.nextFloat(0.6, 0.95) : rng.nextFloat(0.3, 0.7),
        caution: type === 'trader' ? rng.nextFloat(0.5, 0.9) : type === 'raider' ? rng.nextFloat(0.1, 0.5) : rng.nextFloat(0.4, 0.8),
        greed: type === 'trader' ? rng.nextFloat(0.4, 0.9) : type === 'raider' ? rng.nextFloat(0.5, 0.9) : rng.nextFloat(0.1, 0.3),
        loyalty: type === 'trader' ? rng.nextFloat(0.3, 0.7) : type === 'raider' ? rng.nextFloat(0.1, 0.4) : rng.nextFloat(0.6, 1.0),
        flavor: type === 'trader' ? rng.pick(['Cautious merchant','Opportunistic trader','Honest dealer','Shrewd negotiator','Nomadic peddler']) : type === 'raider' ? rng.pick(['Bloodthirsty pirate','Calculating raider','Desperate outlaw','Opportunistic thief','Vengeful renegade']) : rng.pick(['Steadfast enforcer','Veteran patrol officer','Young idealist','Pragmatic peacekeeper']),
      },
      ship: {
        name: '',
        hull,
        maxHull,
        shield,
        maxShield,
        weaponDamage: weapon,
        dodgeChance: dodge,
        credits,
      },
      currentSectorId: sectorId,
      credits,
      cargo,
      memory: {
        lastActions: [],
        grudges: [],
        alliances: [],
        marketObservations: [],
      },
      isActive: true,
      turnsSinceSpawn: 0,
    });
  }

  return [...alive, ...newNPCs];
}

// ── Shuffle helper ─────────────────────────────────────────

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j] as T;
    a[j] = tmp;
  }
  return a;
}

// ── Main tick function ─────────────────────────────────────

export async function tickNPCs(
  container: GameStateContainer,
  llmConfig?: LLMConfig,
): Promise<{ container: GameStateContainer; news: NewsItem[]; stats: TickStats }> {
  const startTime = performance.now();
  const stats: TickStats = {
    npcsProcessed: 0,
    actionsTaken: 0,
    llmCalls: 0,
    llmCost: 0,
    durationMs: 0,
  };

  const allNews: NewsItem[] = [];
  let currentContainer = container;
  const galaxy = currentContainer.galaxy;
  const player = currentContainer.player;

  // Get active NPCs within 2-sector radius
  const activeNPCs = currentContainer.getActiveNPCs(player.currentSector, 2);
  stats.npcsProcessed = activeNPCs.length;

  if (activeNPCs.length === 0) {
    stats.durationMs = Math.round(performance.now() - startTime);
    return { container: currentContainer, news: [], stats };
  }

  // Shuffle turn order
  const turnOrder = shuffle(activeNPCs, Math.random);

  // Build a mutable NPC map for this tick
  const npcMap = new Map<string, NPC>(currentContainer.npcs.map(n => [n.id, { ...n }]));

  for (const npc of turnOrder) {
    const currentNPC = npcMap.get(npc.id);
    if (!currentNPC || currentNPC.ship.hull <= 0) continue;

    // Decide action
    let action: import('./types.js').NPCAction;
    try {
      action = await decideAction(currentNPC, galaxy, [player], llmConfig);
      if (llmConfig && llmConfig.provider !== 'disabled') {
        stats.llmCalls++;
      }
    } catch {
      // Fallback on any error
      const { decideRuleBased } = await import('./brain.js');
      action = decideRuleBased(currentNPC, galaxy, [player]);
    }

    // Handle NPC-to-NPC combat
    if (action.type === 'attack' && action.targetId !== 'player') {
      const targetNPC = Array.from(npcMap.values()).find(
        n => n.id === action.targetId || n.persona.name === action.targetId
      );
      if (targetNPC && targetNPC.ship.hull > 0 && targetNPC.currentSectorId === currentNPC.currentSectorId) {
        const result = resolveNPCCombat(currentNPC, targetNPC);
        npcMap.set(currentNPC.id, result.attacker);
        npcMap.set(targetNPC.id, result.defender);
        allNews.push(result.news);
        stats.actionsTaken++;
        continue;
      }
    }

    // Normal action execution
    const result = executeNPCAction(currentNPC, action, galaxy);
    npcMap.set(currentNPC.id, result.npc);
    if (result.news) {
      allNews.push(result.news);
    }
    stats.actionsTaken++;
  }

  // Decay memory for all NPCs
  let allNPCs = Array.from(npcMap.values()).map(decayMemory);

  // Respawn destroyed NPCs
  const respawned = respawnDestroyedNPCs(allNPCs, galaxy, Date.now());
  if (respawned.length !== allNPCs.length) {
    allNews.push({
      timestamp: new Date().toISOString(),
      headline: `${respawned.length - allNPCs.length} new ship${respawned.length - allNPCs.length > 1 ? 's' : ''} entered the galaxy`,
      type: 'event',
    });
  }

  // Build updated container
  currentContainer = currentContainer.updateNPCs(respawned);
  for (const newsItem of allNews) {
    currentContainer = currentContainer.addNews(newsItem);
  }

  stats.durationMs = Math.round(performance.now() - startTime);
  return { container: currentContainer, news: allNews, stats };
}
