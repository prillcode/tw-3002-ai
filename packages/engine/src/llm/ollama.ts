/**
 * Ollama LLM provider — local inference, no API key needed.
 */
import type { LLMProvider, ChatMessage, ChatOptions, ChatResponse, TokenUsage } from './provider.js';

export const OLLAMA_DEFAULT_ENDPOINT = 'http://localhost:11434';
export const OLLAMA_DEFAULT_MODEL = 'llama3.2:3b';

export class OllamaProvider implements LLMProvider {
  readonly name = 'ollama';
  private endpoint: string;
  private model: string;
  private usage: TokenUsage = { promptTokens: 0, completionTokens: 0 };

  constructor(model?: string, endpoint?: string) {
    this.endpoint = endpoint?.replace(/\/$/, '') ?? OLLAMA_DEFAULT_ENDPOINT;
    this.model = model ?? OLLAMA_DEFAULT_MODEL;
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const res = await fetch(`${this.endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        stream: false,
        format: options?.responseFormat === 'json' ? 'json' : undefined,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 256,
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => 'unknown error');
      throw new Error(`Ollama error ${res.status}: ${text}`);
    }

    const data = await res.json() as {
      message?: { content?: string };
      prompt_eval_count?: number;
      eval_count?: number;
      model?: string;
    };

    const content = data.message?.content ?? '';
    const promptTokens = data.prompt_eval_count ?? 0;
    const completionTokens = data.eval_count ?? 0;

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
}

/**
 * Check if Ollama is available at the given endpoint.
 */
export async function isOllamaAvailable(endpoint?: string): Promise<boolean> {
  const url = (endpoint ?? OLLAMA_DEFAULT_ENDPOINT).replace(/\/$/, '');
  try {
    const res = await fetch(`${url}/api/tags`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}
