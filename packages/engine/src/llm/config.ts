/**
 * LLM config loader — reads ~/.tw3002/config.json with safe defaults.
 */
import type { LLMConfig } from './provider.js';

export const DEFAULT_CONFIG: LLMConfig = {
  provider: 'disabled',
  model: 'llama3.2:3b',
  temperature: 0.7,
  maxTokens: 256,
};

const CONFIG_PATH = `${process.env.HOME}/.tw3002/config.json`;

export interface ConfigLoadResult {
  config: LLMConfig;
  warning?: string;
}

export type LLMHealthResult =
  | { ok: true; quote: string; model?: string; latencyMs: number }
  | { ok: false; error: string };

/**
 * Test LLM connection with a thematic prompt.
 * Returns a space-trading quote on success, or an error message.
 */
export async function testLLMConnection(config: LLMConfig): Promise<LLMHealthResult> {
  if (config.provider === 'disabled') {
    return { ok: false, error: 'LLM provider is disabled. NPCs will use rule-based logic.' };
  }

  const { createProvider } = await import('./factory.js');
  const provider = createProvider(config);
  if (!provider) {
    return { ok: false, error: `Failed to create ${config.provider} provider. Check your config.` };
  }

  const start = performance.now();
  try {
    const response = await provider.chat(
      [
        {
          role: 'system',
          content: 'You are a grizzled space trader from the BBS era. Respond with exactly one short quote (1 sentence) about space trading, profit, or the void. No markdown, no quotes around the text.',
        },
        {
          role: 'user',
          content: 'Share a space trading themed quote.',
        },
      ],
      {
        temperature: 0.9,
        maxTokens: 64,
      }
    );
    const latencyMs = Math.round(performance.now() - start);
    const quote = response.content.trim().replace(/^["']|["']$/g, '').slice(0, 120);
    return { ok: true, quote, model: response.model, latencyMs };
  } catch (err) {
    return { ok: false, error: (err as Error).message || 'Unknown LLM error' };
  }
}

/**
 * Load LLM config from disk. Returns defaults if file missing or invalid.
 */
export function loadConfig(): ConfigLoadResult {
  try {
    const fs = require('fs');
    if (!fs.existsSync(CONFIG_PATH)) {
      const warning = 'No LLM config found — NPCs will use rule-based logic. Create ~/.tw3002/config.json to enable AI-driven NPCs.';
      console.log('[LLM]', warning);
      return { config: DEFAULT_CONFIG, warning };
    }

    const text = fs.readFileSync(CONFIG_PATH, 'utf-8');
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch (parseErr) {
      const warning = `Config file is not valid JSON (${(parseErr as Error).message}). NPCs will use rule-based logic.`;
      console.warn('[LLM]', warning);
      return { config: DEFAULT_CONFIG, warning };
    }

    const npcBrain = (raw as Record<string, unknown>).npcBrain ?? raw;

    const config: LLMConfig = {
      provider: validateProvider((npcBrain as Record<string, unknown>).provider) ? (npcBrain as Record<string, unknown>).provider as LLMConfig['provider'] : 'disabled',
      model: ((npcBrain as Record<string, unknown>).model as string) ?? DEFAULT_CONFIG.model,
      apiKey: (npcBrain as Record<string, unknown>).apiKey as string | undefined,
      endpoint: (npcBrain as Record<string, unknown>).endpoint as string | undefined,
      temperature: typeof (npcBrain as Record<string, unknown>).temperature === 'number' ? (npcBrain as Record<string, unknown>).temperature as number : DEFAULT_CONFIG.temperature,
      maxTokens: typeof (npcBrain as Record<string, unknown>).maxTokens === 'number' ? (npcBrain as Record<string, unknown>).maxTokens as number : DEFAULT_CONFIG.maxTokens,
    };

    // Validation
    if (config.provider === 'openrouter' && !config.apiKey) {
      const warning = 'OpenRouter selected but no apiKey found. NPCs will use rule-based logic. Add your API key to ~/.tw3002/config.json.';
      console.warn('[LLM]', warning);
      return { config: { ...DEFAULT_CONFIG }, warning };
    }

    console.log(`[LLM] Using provider: ${config.provider}${config.model ? ` (${config.model})` : ''}`);
    return { config };
  } catch (err) {
    const warning = `Unexpected error loading config: ${(err as Error).message}. NPCs will use rule-based logic.`;
    console.warn('[LLM]', warning);
    return { config: DEFAULT_CONFIG, warning };
  }
}

/**
 * Save config to disk.
 */
export function saveConfig(config: LLMConfig): void {
  try {
    const fs = require('fs');
    const dir = `${process.env.HOME}/.tw3002`;
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      CONFIG_PATH,
      JSON.stringify({ npcBrain: config }, null, 2)
    );
  } catch (err) {
    console.error('[LLM] Failed to save config:', err);
  }
}

function validateProvider(p: unknown): p is LLMConfig['provider'] {
  return p === 'disabled' || p === 'ollama' || p === 'openrouter' || p === 'mock';
}
