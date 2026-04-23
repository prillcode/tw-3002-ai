/**
 * NPC memory mutation helpers.
 * Grudges, alliances, market observations, reputation, decay.
 */
import type { NPC, Grudge, Alliance, MarketObservation } from './types.js';
import type { Commodity } from '../types.js';

// ── Grudges ────────────────────────────────────────────────

export function addGrudge(
  npc: NPC,
  targetId: string,
  targetName: string,
  reason: string,
  severity: number,
): NPC {
  const grudges = [...npc.memory.grudges];
  const existing = grudges.findIndex(g => g.targetId === targetId);

  if (existing >= 0) {
    // Intensify existing grudge
    grudges[existing] = {
      ...grudges[existing]!,
      severity: Math.min(10, grudges[existing]!.severity + severity),
      reason,
    };
  } else {
    grudges.push({
      targetId,
      targetName,
      reason,
      severity: Math.min(10, Math.max(1, severity)),
      formedAt: new Date().toISOString(),
    });
  }

  // Cap at 5 grudges — drop lowest severity
  if (grudges.length > 5) {
    grudges.sort((a, b) => a.severity - b.severity);
    grudges.shift();
  }

  return {
    ...npc,
    memory: {
      ...npc.memory,
      grudges,
    },
  };
}

export function removeGrudge(npc: NPC, targetId: string): NPC {
  return {
    ...npc,
    memory: {
      ...npc.memory,
      grudges: npc.memory.grudges.filter(g => g.targetId !== targetId),
    },
  };
}

// ── Alliances ──────────────────────────────────────────────

export function addAlliance(npc: NPC, targetId: string, targetName: string): NPC {
  const existing = npc.memory.alliances.find(a => a.targetId === targetId);
  if (existing) return npc;

  const alliances = [...npc.memory.alliances, {
    targetId,
    targetName,
    formedAt: new Date().toISOString(),
  }];

  // Cap at 3 alliances — drop oldest
  if (alliances.length > 3) {
    alliances.shift();
  }

  return {
    ...npc,
    memory: {
      ...npc.memory,
      alliances,
    },
  };
}

export function breakAlliance(npc: NPC, targetId: string): NPC {
  return {
    ...npc,
    memory: {
      ...npc.memory,
      alliances: npc.memory.alliances.filter(a => a.targetId !== targetId),
    },
  };
}

// ── Market Observations ────────────────────────────────────

export function addMarketObservation(
  npc: NPC,
  sectorId: number,
  commodity: Commodity,
  price: number,
): NPC {
  const observations = [...npc.memory.marketObservations, {
    sectorId,
    commodity,
    price,
    at: new Date().toISOString(),
  }];

  // Cap at 10 — drop oldest
  if (observations.length > 10) {
    observations.shift();
  }

  return {
    ...npc,
    memory: {
      ...npc.memory,
      marketObservations: observations,
    },
  };
}

// ── Reputation ─────────────────────────────────────────────

export interface Reputation {
  targetId: string;
  targetName: string;
  score: number;     // -100 to +100
  interactions: number;
  lastInteraction: string;
}

export function updateReputation(
  npc: NPC,
  targetId: string,
  targetName: string,
  delta: number,
): NPC {
  const rep = npc.memory.reputation ?? {};
  const existing = rep[targetId];

  const updated: Reputation = existing
    ? {
        ...existing,
        score: Math.max(-100, Math.min(100, existing.score + delta)),
        interactions: existing.interactions + 1,
        lastInteraction: new Date().toISOString(),
      }
    : {
        targetId,
        targetName,
        score: Math.max(-100, Math.min(100, delta)),
        interactions: 1,
        lastInteraction: new Date().toISOString(),
      };

  return {
    ...npc,
    memory: {
      ...npc.memory,
      reputation: { ...rep, [targetId]: updated },
    },
  };
}

export function getReputation(npc: NPC, targetId: string): Reputation | null {
  return npc.memory.reputation?.[targetId] ?? null;
}

// ── Memory Decay ───────────────────────────────────────────

export function decayMemory(npc: NPC): NPC {
  const now = Date.now();
  const fiveTurnsAgo = now - 5 * 60 * 1000; // approx 5 turns (generous)
  const twentyTurnsAgo = now - 20 * 60 * 1000;

  // Decay grudges: -1 severity per 5 turns, remove below 2
  const grudges = npc.memory.grudges
    .map(g => {
      const age = now - new Date(g.formedAt).getTime();
      const decay = Math.floor(age / (5 * 60 * 1000));
      return { ...g, severity: Math.max(0, g.severity - decay) };
    })
    .filter(g => g.severity >= 2);

  // Remove old market observations
  const marketObservations = npc.memory.marketObservations.filter(
    o => new Date(o.at).getTime() > twentyTurnsAgo
  );

  return {
    ...npc,
    memory: {
      ...npc.memory,
      grudges,
      marketObservations,
    },
  };
}
