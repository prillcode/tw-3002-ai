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
    if (!fs.existsSync(CONFIG_PATH)) return DEFAULT_CONFIG;

    const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    const npcBrain = raw.npcBrain ?? raw;

    const config: LLMConfig = {
      provider: validateProvider(npcBrain.provider) ? npcBrain.provider : 'disabled',
      model: npcBrain.model ?? DEFAULT_CONFIG.model,
      apiKey: npcBrain.apiKey,
      endpoint: npcBrain.endpoint,
      temperature: typeof npcBrain.temperature === 'number' ? npcBrain.temperature : DEFAULT_CONFIG.temperature,
      maxTokens: typeof npcBrain.maxTokens === 'number' ? npcBrain.maxTokens : DEFAULT_CONFIG.maxTokens,
    };

    // Validation
    if (config.provider === 'openrouter' && !config.apiKey) {
      console.warn('[LLM] OpenRouter provider selected but no apiKey. Falling back to disabled.');
      return { ...DEFAULT_CONFIG };
    }

    return config;
  } catch {
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
