# OpenRouter Setup Guide for TW 3002 AI

This guide walks you through configuring TW 3002 AI to use **OpenRouter** as the LLM backend for NPC decision-making.

## Why OpenRouter?

- **No local GPU needed** — runs in the cloud
- **Pay-per-use** — typically $0.003–0.01 per game session
- **Model choice** — GPT-4o-mini, Claude Haiku, Gemini Flash, and 100+ others
- **One API key** — access to multiple providers

> **Alternative:** Prefer local, free, offline inference? See [Ollama setup](#ollama-alternative) below.

---

## Prerequisites

- TW 3002 AI installed and running (see [GAME_GUIDE.md](./GAME_GUIDE.md))
- An OpenRouter account (free to create)

---

## Step 1: Get an API Key

1. Go to [openrouter.ai](https://openrouter.ai)
2. Create an account (email or GitHub OAuth)
3. Navigate to **Settings → API Keys**
4. Click **Create Key**
5. Copy the key (starts with `sk-or-v1-`)

> **Free tier:** OpenRouter gives you a small amount of free credits to start. After that, top up via the billing page. Most users spend less than $1/month for TW 3002 AI.

---

## Step 2: Create the Config File

Create `~/.tw3002/config.json` with your API key:

```bash
mkdir -p ~/.tw3002
cat > ~/.tw3002/config.json << 'EOF'
{
  "npcBrain": {
    "provider": "openrouter",
    "apiKey": "sk-or-v1-YOUR_KEY_HERE",
    "model": "openai/gpt-4o-mini",
    "temperature": 0.7,
    "maxTokens": 256
  }
}
EOF
```

Replace `sk-or-v1-YOUR_KEY_HERE` with your actual key.

---

## Step 3: Launch the Game

```bash
cd cli
./tw3002
```

Start a new game or continue an existing save. When NPCs take their turns (after ship class selection or on continue), you'll see the galaxy evolve with LLM-driven decisions.

---

## Model Recommendations

| Model | Cost (per 1M tokens) | Quality | Speed | Best For |
|-------|---------------------|---------|-------|----------|
| `openai/gpt-4o-mini` | $0.15 / $0.60 | ★★★★☆ | Fast | **Default choice** — best balance |
| `anthropic/claude-3-haiku` | $0.25 / $1.25 | ★★★★☆ | Fast | Excellent instruction following |
| `google/gemini-flash-1.5` | $0.075 / $0.30 | ★★★☆☆ | Very fast | Cheapest option, decent quality |
| `meta-llama/llama-3.1-8b` | $0.02 / $0.02 | ★★★☆☆ | Fast | Budget option |

> **Cost estimate:** A typical session processes ~10–15 NPCs × ~500 tokens = ~7,500 tokens. With caching, this drops by 30–50%.
>
> - GPT-4o-mini: ~$0.003–0.01 per session
> - Gemini Flash: ~$0.001–0.004 per session

---

## Troubleshooting

### "OpenRouter: Invalid API key"

- Check that your key starts with `sk-or-v1-`
- Verify the key is active at [openrouter.ai/keys](https://openrouter.ai/keys)
- Ensure `config.json` is valid JSON (no trailing commas)

### "OpenRouter: Rate limited"

- You're sending too many requests too fast
- The game already processes NPCs serially (not in parallel) to avoid this
- If it still happens, switch to a cheaper model or enable rule-based mode temporarily

### NPCs still act the same as before

- Check that `config.json` is at `~/.tw3002/config.json` (not in the repo root)
- Verify the file parses correctly: `cat ~/.tw3002/config.json | python3 -m json.tool`
- Rule-based decisions and LLM decisions often look similar — check the news ticker for more varied headlines

### Game feels slow on login

- LLM calls add 0.5–2 seconds per NPC
- With 15 active NPCs, first login may take 5–10 seconds
- Subsequent ticks benefit from the response cache
- For instant loads, switch to rule-based: `"provider": "disabled"`

---

## Ollama Alternative

If you prefer **free, local, offline** inference:

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a lightweight model
ollama pull llama3.2:3b

# Start the server
ollama serve
```

Then set `~/.tw3002/config.json`:

```json
{
  "npcBrain": {
    "provider": "ollama",
    "model": "llama3.2:3b",
    "temperature": 0.7,
    "maxTokens": 256
  }
}
```

> Ollama runs on `http://localhost:11434` by default. No API key needed.

---

## Disabling LLM Mode

To revert to rule-based NPCs (instant, zero cost):

```json
{
  "npcBrain": {
    "provider": "disabled"
  }
}
```

Or simply delete `~/.tw3002/config.json`.

---

## Privacy Note

When using OpenRouter, NPC prompts (which include sector info, NPC stats, and nearby player data) are sent to OpenRouter's servers and then to the underlying model provider (OpenAI, Anthropic, etc.).

- No personal data is included in prompts
- Prompts do not include your ship name or real identity
- OpenRouter's privacy policy applies: [openrouter.ai/privacy](https://openrouter.ai/privacy)

For maximum privacy, use **Ollama** (local) instead.

---

## See Also

- [GAME_GUIDE.md](./GAME_GUIDE.md) — Full gameplay guide
- [Pi Agent / OpenCode Integration](./GAME_GUIDE.md#coming-soon-alternative-llm-backends) — Future provider options
