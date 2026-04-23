/**
 * Factory for creating LLM providers from config.
 */
import type { LLMProvider, LLMConfig } from './provider.js';
import { OllamaProvider } from './ollama.js';
import { OpenRouterProvider } from './openrouter.js';
import { MockProvider } from './mock.js';

export function createProvider(config: LLMConfig): LLMProvider | null {
  switch (config.provider) {
    case 'ollama':
      return new OllamaProvider(config.model, config.endpoint);
    case 'openrouter':
      if (!config.apiKey) return null;
      return new OpenRouterProvider(config.apiKey, config.model);
    case 'mock':
      return new MockProvider(config.model);
    case 'disabled':
    default:
      return null;
  }
}
