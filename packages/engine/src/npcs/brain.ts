/**
 * Hybrid NPC decision engine.
 * Tries LLM first (if configured), falls back to rule-based.
 */
import type { Galaxy, Commodity } from '../types.js';
import type { NPC, NPCAction, NPCActionRecord, NewsItem } from './types.js';
import type { PlayerShip } from '../ships/upgrades.js';
import type { LLMConfig } from '../llm/provider.js';
import { getNeighborIds } from '../galaxy/generator.js';
import { getPrices } from '../economy/pricing.js';
import { createProvider } from '../llm/factory.js';
import { buildPrompt } from '../llm/prompts.js';
import { parseNPCDecision } from '../llm/parser.js';
import { globalCache, canUseCache, makeCacheKey } from '../llm/cache.js';

// ── Timeout helper ─────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('LLM timeout')), ms)
    ),
  ]);
}

// ── Helpers ────────────────────────────────────────────────

function bfsPath(galaxy: Galaxy, from: number, to: number): number[] {
  const visited = new Set<number>([from]);
  const queue: Array<{ id: number; path: number[] }> = [{ id: from, path: [] }];

  while (queue.length > 0) {
    const { id, path } = queue.shift()!;
    const neighbors = getNeighborIds(galaxy, id);

    for (const n of neighbors) {
      if (n === to) return [...path, n];
      if (!visited.has(n)) {
        visited.add(n);
        queue.push({ id: n, path: [...path, n] });
      }
    }
  }

  return [];
}

function randomMove(galaxy: Galaxy, npc: NPC, rng: () => number): number | null {
  const neighbors = getNeighborIds(galaxy, npc.currentSectorId);
  if (neighbors.length === 0) return null;

  // Bias: raiders toward dangerous, traders toward ports, patrols toward FedSpace
  const sector = galaxy.sectors.get(npc.currentSectorId);

  if (npc.persona.type === 'raider') {
    const dangerous = neighbors.filter(n => galaxy.sectors.get(n)?.danger === 'dangerous');
    if (dangerous.length > 0 && rng() < 0.6) {
      return dangerous[Math.floor(rng() * dangerous.length)]!;
    }
  }

  if (npc.persona.type === 'trader') {
    const withPorts = neighbors.filter(n => galaxy.sectors.get(n)?.port);
    if (withPorts.length > 0 && rng() < 0.5) {
      return withPorts[Math.floor(rng() * withPorts.length)]!;
    }
  }

  if (npc.persona.type === 'patrol') {
    const safe = neighbors.filter(n => galaxy.sectors.get(n)?.danger === 'safe');
    if (safe.length > 0 && rng() < 0.5) {
      return safe[Math.floor(rng() * safe.length)]!;
    }
  }

  return neighbors[Math.floor(rng() * neighbors.length)] ?? null;
}

// ── Decision Logic ─────────────────────────────────────────

function decideTrader(npc: NPC, galaxy: Galaxy, players: PlayerShip[], rng: () => number): NPCAction {
  const sector = galaxy.sectors.get(npc.currentSectorId);

  // If player in same sector and low caution, maybe attack (rare for traders)
  const playerHere = players.find(p => p.currentSector === npc.currentSectorId);
  if (playerHere && rng() < npc.persona.aggression * 0.3) {
    return { type: 'attack', targetId: 'player' };
  }

  // Trade if port exists and we have cargo or credits
  if (sector?.port && npc.credits > 500) {
    const prices = getPrices(sector.port);
    // Sell what we have
    for (const [commodity, amount] of Object.entries(npc.cargo)) {
      if (amount > 5) {
        const quote = prices.find(p => p.commodity === commodity);
        if (quote && quote.sellPrice > 50) {
          const qty = Math.min(amount, 10);
          return { type: 'trade', commodity: commodity as Commodity, direction: 'sell', quantity: qty };
        }
      }
    }
    // Buy something cheap
    const affordable = prices.filter(p => p.buyPrice < npc.credits * 0.3 && p.available > 10);
    if (affordable.length > 0) {
      const best = affordable.reduce((a, b) => (a.buyPrice < b.buyPrice ? a : b));
      const qty = Math.min(10, Math.floor(npc.credits / best.buyPrice * 0.5));
      if (qty > 0) {
        return { type: 'trade', commodity: best.commodity, direction: 'buy', quantity: qty };
      }
    }
  }

  // Move toward a port if no port here
  if (!sector?.port) {
    const neighbors = getNeighborIds(galaxy, npc.currentSectorId);
    const withPorts = neighbors.filter(n => galaxy.sectors.get(n)?.port);
    if (withPorts.length > 0) {
      return { type: 'move', targetSector: withPorts[0]! };
    }
  }

  // Random move
  const target = randomMove(galaxy, npc, rng);
  if (target !== null) return { type: 'move', targetSector: target };

  return { type: 'idle' };
}

function decideRaider(npc: NPC, galaxy: Galaxy, players: PlayerShip[], rng: () => number): NPCAction {
  const playerHere = players.find(p => p.currentSector === npc.currentSectorId);
  const playerRep = npc.memory.reputation?.['player']?.score ?? 0;

  // Low hull = hide
  if (npc.ship.hull / npc.ship.maxHull < 0.3) {
    const neighbors = getNeighborIds(galaxy, npc.currentSectorId);
    const safe = neighbors.filter(n => galaxy.sectors.get(n)?.danger === 'safe');
    if (safe.length > 0) {
      return { type: 'move', targetSector: safe[0]! };
    }
    const target = randomMove(galaxy, npc, rng);
    if (target !== null) return { type: 'move', targetSector: target };
    return { type: 'flee', targetId: 'player' };
  }

  // Player present = attack or flee (reputation-aware)
  if (playerHere) {
    // Deep grudge = always attack
    if (playerRep < -50) {
      return { type: 'attack', targetId: 'player' };
    }
    // Positive reputation + not extremely aggressive = don't attack
    if (playerRep > 20 && npc.persona.aggression < 0.9) {
      return { type: 'idle' };
    }
    if (rng() < npc.persona.aggression) {
      return { type: 'attack', targetId: 'player' };
    }
    if (rng() < npc.persona.caution) {
      return { type: 'flee', targetId: 'player' };
    }
  }

  // Move toward dangerous/frontier
  const target = randomMove(galaxy, npc, rng);
  if (target !== null) return { type: 'move', targetSector: target };

  return { type: 'idle' };
}

function decidePatrol(npc: NPC, galaxy: Galaxy, players: PlayerShip[], rng: () => number): NPCAction {
  // Check for raiders in same sector
  // (In full implementation, we'd check NPC list. For now, just patrol.)
  const neighbors = getNeighborIds(galaxy, npc.currentSectorId);
  const safe = neighbors.filter(n => galaxy.sectors.get(n)?.danger === 'safe');

  if (safe.length > 0 && rng() < 0.6) {
    return { type: 'move', targetSector: safe[Math.floor(rng() * safe.length)]! };
  }

  const target = randomMove(galaxy, npc, rng);
  if (target !== null) return { type: 'move', targetSector: target };

  return { type: 'idle' };
}

/**
 * Decide an NPC's next action using rule-based logic.
 * This is the fallback when LLM is disabled or fails.
 */
export function decideRuleBased(
  npc: NPC,
  galaxy: Galaxy,
  players: PlayerShip[],
  rng: () => number = Math.random,
): NPCAction {
  switch (npc.persona.type) {
    case 'trader':
      return decideTrader(npc, galaxy, players, rng);
    case 'raider':
      return decideRaider(npc, galaxy, players, rng);
    case 'patrol':
      return decidePatrol(npc, galaxy, players, rng);
  }
}

export type DecisionSource = 'llm' | 'cache' | 'rule';

export interface NPCDecision {
  action: NPCAction;
  source: DecisionSource;
}

/**
 * Decide an NPC's next action.
 * Tries LLM if configured, falls back to rule-based on any failure.
 * Uses cache to skip redundant LLM calls.
 */
export async function decideAction(
  npc: NPC,
  galaxy: Galaxy,
  players: PlayerShip[],
  config?: LLMConfig,
): Promise<NPCDecision> {
  // Fast path: no config or disabled → rules
  if (!config || config.provider === 'disabled') {
    return { action: decideRuleBased(npc, galaxy, players), source: 'rule' };
  }

  // Check cache
  const shouldCache = canUseCache(npc, players);
  const cacheKey = shouldCache ? makeCacheKey(npc, galaxy, players) : null;

  if (cacheKey) {
    const cached = globalCache.get(cacheKey);
    if (cached) {
      // Record cached decision in memory
      const now = new Date().toISOString();
      npc.memory = {
        ...npc.memory,
        lastActions: [
          ...npc.memory.lastActions,
          {
            action: cached.action,
            result: `Cached: ${cached.reasoning}`,
            at: now,
          },
        ].slice(-3),
      };
      return { action: cached.action, source: 'cache' };
    }
  }

  // Build provider
  const provider = createProvider(config);
  if (!provider) return { action: decideRuleBased(npc, galaxy, players), source: 'rule' };

  // Build prompt
  const systemPrompt = `You are an NPC in a space trading game called TW 3002 AI.
You must respond with ONLY a valid JSON object. No markdown, no explanations.

Your response must match this schema:
{
  "action": "move" | "trade" | "attack" | "flee" | "idle",
  "params": { ...action-specific fields... },
  "reasoning": "brief in-character thought (1 sentence)"
}

Action param schemas:
- move:    { "targetSector": number }
- trade:   { "commodity": "ore"|"organics"|"equipment", "direction": "buy"|"sell", "quantity": number }
- attack:  { "targetId": string }
- flee:    { "targetId": string }
- idle:    {}`;

  const userPrompt = buildPrompt(npc, galaxy, players);

  // Call LLM with timeout
  try {
    const response = await withTimeout(
      provider.chat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        {
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          responseFormat: 'json',
        }
      ),
      5000 // 5 second timeout
    );

    // Parse and validate
    const parsed = parseNPCDecision(response.content, galaxy, npc.currentSectorId);
    if (parsed) {
      // Cache the result
      if (cacheKey) {
        globalCache.set(cacheKey, {
          action: parsed.action,
          reasoning: parsed.reasoning,
          timestamp: Date.now(),
        });
      }

      // Record reasoning in memory for flavor
      const now = new Date().toISOString();
      npc.memory = {
        ...npc.memory,
        lastActions: [
          ...npc.memory.lastActions,
          {
            action: parsed.action,
            result: `LLM: ${parsed.reasoning}`,
            at: now,
          },
        ].slice(-3),
      };
      return { action: parsed.action, source: 'llm' };
    }
  } catch (err) {
    // Silently fall back to rules on any error
  }

  // Fallback
  return { action: decideRuleBased(npc, galaxy, players), source: 'rule' };
}

/**
 * Execute an NPC action and return the updated NPC + news item.
 */
export function executeNPCAction(
  npc: NPC,
  action: NPCAction,
  galaxy: Galaxy,
): { npc: NPC; news?: NewsItem } {
  const now = new Date().toISOString();
  let updated = { ...npc };
  let news: NewsItem | undefined;

  switch (action.type) {
    case 'move': {
      updated.currentSectorId = action.targetSector;
      const sectorName = galaxy.sectors.get(action.targetSector)?.name ?? `Sector ${action.targetSector}`;
      news = {
        timestamp: now,
        headline: `${npc.persona.name} arrived at ${sectorName}`,
        type: 'movement',
        sectorId: action.targetSector,
      };
      break;
    }

    case 'trade': {
      const sector = galaxy.sectors.get(npc.currentSectorId);
      if (sector?.port) {
        const prices = getPrices(sector.port);
        const quote = prices.find(p => p.commodity === action.commodity);
        if (quote) {
          if (action.direction === 'buy') {
            const cost = quote.buyPrice * action.quantity;
            if (updated.credits >= cost && quote.available >= action.quantity) {
              updated.credits -= cost;
              updated.cargo[action.commodity] = (updated.cargo[action.commodity] ?? 0) + action.quantity;
              sector.port.inventory[action.commodity] = (sector.port.inventory[action.commodity] ?? 0) - action.quantity;
              news = {
                timestamp: now,
                headline: `${npc.persona.name} bought ${action.quantity} ${action.commodity} at ${sector.name}`,
                type: 'trade',
                sectorId: npc.currentSectorId,
              };
            }
          } else {
            const revenue = quote.sellPrice * action.quantity;
            const owned = updated.cargo[action.commodity] ?? 0;
            if (owned >= action.quantity) {
              updated.credits += revenue;
              updated.cargo[action.commodity] = owned - action.quantity;
              sector.port.inventory[action.commodity] = (sector.port.inventory[action.commodity] ?? 0) + action.quantity;
              news = {
                timestamp: now,
                headline: `${npc.persona.name} sold ${action.quantity} ${action.commodity} at ${sector.name}`,
                type: 'trade',
                sectorId: npc.currentSectorId,
              };
            }
          }
        }
      }
      break;
    }

    case 'attack': {
      news = {
        timestamp: now,
        headline: `${npc.persona.name} attacked ${action.targetId === 'player' ? 'a ship' : action.targetId}`,
        type: 'combat',
        sectorId: npc.currentSectorId,
      };
      break;
    }

    case 'flee': {
      // Move to a neighbor
      const neighbors = getNeighborIds(galaxy, npc.currentSectorId);
      if (neighbors.length > 0) {
        updated.currentSectorId = neighbors[0]!;
      }
      break;
    }

    case 'idle':
      break;
  }

  // Record action in memory
  const record: NPCActionRecord = {
    action,
    result: news?.headline ?? 'Nothing happened',
    at: now,
  };
  updated.memory = {
    ...updated.memory,
    lastActions: [...updated.memory.lastActions, record].slice(-3),
  };
  updated.turnsSinceSpawn += 1;

  return { npc: updated, news };
}

/**
 * Convert an NPC to a Combatant for combat resolution.
 */
export function npcToCombatant(npc: NPC): import('../combat/types.js').Combatant {
  return {
    name: npc.persona.name,
    hull: npc.ship.hull,
    maxHull: npc.ship.maxHull,
    shield: npc.ship.shield,
    maxShield: npc.ship.maxShield,
    weaponDamage: npc.ship.weaponDamage,
    dodgeChance: npc.ship.dodgeChance,
    credits: npc.credits,
    npcId: npc.id,
  };
}
