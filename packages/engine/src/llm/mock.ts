/**
 * Mock LLM provider — deterministic responses for testing.
 * No network calls. Free. Predictable.
 */
import type { LLMProvider, ChatMessage, ChatOptions, ChatResponse, TokenUsage } from './provider.js';
import type { NPCType } from '../npcs/types.js';

export const MOCK_DEFAULT_MODEL = 'mock';

/** Deterministic canned decisions keyed by NPC type. */
const CANNED_DECISIONS: Record<NPCType, string[]> = {
  trader: [
    '{"action":"trade","params":{"commodity":"ore","direction":"buy","quantity":10},"reasoning":"Ore prices look low here, stocking up."}',
    '{"action":"trade","params":{"commodity":"organics","direction":"sell","quantity":5},"reasoning":"Time to offload these organics for profit."}',
    '{"action":"move","params":{"targetSector":0},"reasoning":"Heading to the next port for better deals."}',
    '{"action":"idle","params":{},"reasoning":"Waiting for the market to shift."}',
    '{"action":"trade","params":{"commodity":"equipment","direction":"buy","quantity":3},"reasoning":"Equipment is always a safe investment."}',
  ],
  raider: [
    '{"action":"attack","params":{"targetId":"player"},"reasoning":"Easy prey, time to strike."}',
    '{"action":"flee","params":{"targetId":"player"},"reasoning":"That ship looks tougher than expected."}',
    '{"action":"move","params":{"targetSector":0},"reasoning":"Hunting grounds are dry here, moving on."}',
    '{"action":"idle","params":{},"reasoning":"Laying low, watching for targets."}',
    '{"action":"attack","params":{"targetId":"player"},"reasoning":"No mercy for traders in my space."}',
  ],
  patrol: [
    '{"action":"move","params":{"targetSector":0},"reasoning":"Patrolling the perimeter."}',
    '{"action":"idle","params":{},"reasoning":"Sector is quiet, maintaining watch."}',
    '{"action":"attack","params":{"targetId":"npc-raider-1"},"reasoning":"Pirate spotted, engaging."}',
    '{"action":"move","params":{"targetSector":0},"reasoning":"Moving to reinforce FedSpace."}',
  ],
};

/**
 * Simple hash of a string for deterministic selection.
 */
function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function extractNpcTypeFromPrompt(prompt: string): NPCType {
  if (prompt.includes('raider') || prompt.includes('pirate')) return 'raider';
  if (prompt.includes('patrol') || prompt.includes('enforcer')) return 'patrol';
  return 'trader';
}

export class MockProvider implements LLMProvider {
  readonly name = 'mock';
  private model: string;
  private usage: TokenUsage = { promptTokens: 0, completionTokens: 0 };

  constructor(model?: string) {
    this.model = model ?? MOCK_DEFAULT_MODEL;
  }

  async chat(messages: ChatMessage[], _options?: ChatOptions): Promise<ChatResponse> {
    const userPrompt = messages.find(m => m.role === 'user')?.content ?? '';
    const type = extractNpcTypeFromPrompt(userPrompt);
    const decisions = CANNED_DECISIONS[type] ?? CANNED_DECISIONS.trader;

    const idx = hashString(userPrompt) % decisions.length;
    const content = decisions[idx]!;

    // Simulate token counts
    const promptTokens = Math.ceil(userPrompt.length / 4);
    const completionTokens = Math.ceil(content.length / 4);
    this.usage.promptTokens += promptTokens;
    this.usage.completionTokens += completionTokens;

    return {
      content,
      usage: { promptTokens, completionTokens },
      model: this.model,
    };
  }

  getSessionUsage(): TokenUsage {
    return { ...this.usage };
  }
}
