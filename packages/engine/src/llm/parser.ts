/**
 * Parse and validate LLM JSON responses into NPC actions.
 */
import type { NPCAction } from '../npcs/types.js';
import type { Galaxy } from '../types.js';
import { getNeighborIds } from '../galaxy/generator.js';

export interface ParsedDecision {
  action: NPCAction;
  reasoning: string;
}

/**
 * Parse a JSON string from an LLM response.
 * Returns null on any validation failure.
 */
export function parseNPCDecision(json: string, galaxy: Galaxy, currentSectorId: number): ParsedDecision | null {
  let raw: unknown;

  try {
    raw = JSON.parse(json);
  } catch {
    // Try to extract JSON from markdown code blocks
    const codeBlock = json.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlock) {
      try {
        raw = JSON.parse(codeBlock[1]!);
      } catch {
        return null;
      }
    } else {
      return null;
    }
  }

  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const actionType = obj.action;
  if (typeof actionType !== 'string') return null;
  if (!['move', 'trade', 'attack', 'flee', 'idle'].includes(actionType)) return null;

  const params = obj.params;
  if (!params || typeof params !== 'object') return null;
  const p = params as Record<string, unknown>;

  const reasoning = typeof obj.reasoning === 'string' ? obj.reasoning : '';

  // Validate action-specific params and legality
  switch (actionType) {
    case 'move': {
      if (typeof p.targetSector !== 'number') return null;
      // Must be a valid neighbor
      const neighbors = getNeighborIds(galaxy, currentSectorId);
      if (!neighbors.includes(p.targetSector)) return null;
      return {
        action: { type: 'move', targetSector: p.targetSector },
        reasoning,
      };
    }

    case 'trade': {
      if (!['ore', 'organics', 'equipment'].includes(p.commodity as string)) return null;
      if (!['buy', 'sell'].includes(p.direction as string)) return null;
      if (typeof p.quantity !== 'number' || p.quantity < 1 || p.quantity > 1000) return null;
      return {
        action: {
          type: 'trade',
          commodity: p.commodity as 'ore' | 'organics' | 'equipment',
          direction: p.direction as 'buy' | 'sell',
          quantity: Math.round(p.quantity),
        },
        reasoning,
      };
    }

    case 'attack': {
      if (typeof p.targetId !== 'string' || p.targetId.length === 0) return null;
      return {
        action: { type: 'attack', targetId: p.targetId },
        reasoning,
      };
    }

    case 'flee': {
      if (typeof p.targetId !== 'string' || p.targetId.length === 0) return null;
      return {
        action: { type: 'flee', targetId: p.targetId },
        reasoning,
      };
    }

    case 'idle': {
      return {
        action: { type: 'idle' },
        reasoning,
      };
    }

    default:
      return null;
  }
}
