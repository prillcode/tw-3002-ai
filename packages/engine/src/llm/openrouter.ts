/**
 * OpenRouter LLM provider — cloud inference with user's API key.
 */
import type { LLMProvider, ChatMessage, ChatOptions, ChatResponse, TokenUsage } from './provider.js';

export const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
export const OPENROUTER_DEFAULT_MODEL = 'openai/gpt-4o-mini';

export class OpenRouterProvider implements LLMProvider {
  readonly name = 'openrouter';
  private apiKey: string;
  private model: string;
  private usage: TokenUsage = { promptTokens: 0, completionTokens: 0 };

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model ?? OPENROUTER_DEFAULT_MODEL;
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const body: Record<string, unknown> = {
      model: this.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 256,
    };

    if (options?.responseFormat === 'json') {
      body.response_format = { type: 'json_object' };
    }

    const res = await fetch(OPENROUTER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://tw3002.dev',
        'X-Title': 'TW 3002 AI',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => 'unknown error');
      if (res.status === 401) throw new Error(`OpenRouter: Invalid API key`);
      if (res.status === 429) throw new Error(`OpenRouter: Rate limited`);
      throw new Error(`OpenRouter error ${res.status}: ${text}`);
    }

    const data = await res.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
      model?: string;
    };

    const content = data.choices?.[0]?.message?.content ?? '';
    const promptTokens = data.usage?.prompt_tokens ?? 0;
    const completionTokens = data.usage?.completion_tokens ?? 0;

    this.usage.promptTokens += promptTokens;
    this.usage.completionTokens += completionTokens;

    return {
      content,
      usage: { promptTokens, completionTokens },
      model: data.model ?? this.model,
    };
  }

  getSessionUsage(): TokenUsage {
    return { ...this.usage };
  }

  /**
   * Estimate cost in USD for this session.
   */
  getSessionCost(): number {
    const total = this.usage.promptTokens + this.usage.completionTokens;
    // Approximate blended rate; OpenRouter pricing varies by model
    const rate = 0.0005; // $0.50 per 1M tokens
    return (total / 1000) * rate;
  }
}
