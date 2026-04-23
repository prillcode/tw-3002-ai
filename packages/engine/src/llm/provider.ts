/**
 * Abstract LLM provider interface.
 * Supports local (Ollama) and cloud (OpenRouter) backends.
 */

export interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'json';
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
}

export interface ChatResponse {
  content: string;
  usage?: TokenUsage;
  model?: string;
}

export interface LLMProvider {
  readonly name: string;
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  /** Total tokens used this session. */
  getSessionUsage(): TokenUsage;
}

export interface LLMConfig {
  provider: 'disabled' | 'ollama' | 'openrouter' | 'mock';
  model?: string;
  apiKey?: string;
  endpoint?: string;
  temperature?: number;
  maxTokens?: number;
}

/** Rough cost per 1K tokens (USD) for tracking. OpenRouter varies by model. */
export const COST_PER_1K_TOKENS: Record<string, number> = {
  'openai/gpt-4o-mini': 0.00015,
  'openai/gpt-4o': 0.0025,
  'anthropic/claude-3-haiku': 0.00025,
  'anthropic/claude-3-sonnet': 0.003,
  'default': 0.0005,
};
