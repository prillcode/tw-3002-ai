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

/**
 * Load LLM config from disk. Returns defaults if file missing or invalid.
 */
export function loadConfig(): LLMConfig {
  try {
    const fs = require('fs');
    if (!fs.existsSync(CONFIG_PATH)) {
      console.log('[LLM] No config found at', CONFIG_PATH, '- using rule-based NPCs');
      return DEFAULT_CONFIG;
    }

    const text = fs.readFileSync(CONFIG_PATH, 'utf-8');
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch (parseErr) {
      console.warn('[LLM] Config file exists but is not valid JSON:', CONFIG_PATH);
      console.warn('[LLM] Parse error:', (parseErr as Error).message);
      console.warn('[LLM] Falling back to rule-based NPCs. Fix your config and restart.');
      return DEFAULT_CONFIG;
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
      console.warn('[LLM] OpenRouter provider selected but no apiKey. Falling back to disabled.');
      return { ...DEFAULT_CONFIG };
    }

    console.log(`[LLM] Using provider: ${config.provider}${config.model ? ` (${config.model})` : ''}`);
    return config;
  } catch (err) {
    console.warn('[LLM] Unexpected error loading config:', (err as Error).message);
    return DEFAULT_CONFIG;
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
