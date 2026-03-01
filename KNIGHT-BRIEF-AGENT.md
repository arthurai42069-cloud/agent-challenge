# Knight Brief: Nosana Agent Challenge — Market Intelligence Agent

## Context
This is a fork of the Nosana Builders Challenge template at github.com/nosana-ci/agent-challenge.
Project root: /home/arthur/.openclaw/workspace/projects/agent-challenge/

The template uses Mastra (TypeScript AI agent framework) + Next.js frontend + CopilotKit.
A working Weather Agent example is in src/mastra/agents/weather-agent/ — use it as reference.
Your agent goes in src/mastra/agents/your-agent/ (rename appropriately).

## The Agent: "Market Intelligence Agent"

Build a market intelligence agent that can:

### Tools to implement (TypeScript functions in src/mastra/tools/):

1. **getCryptoPrice** — fetch price + 24h change for any coin
   - Use CoinGecko free API: `https://api.coingecko.com/api/v3/simple/price?ids={coin}&vs_currencies=usd&include_24hr_change=true`
   - Input: coin name or id (e.g. "bitcoin", "solana", "ethereum")
   - Output: price, 24h change %, market cap if available
   - Handle: normalize common names (btc→bitcoin, sol→solana, eth→ethereum)

2. **getTopMovers** — fetch top 5 gainers and losers in the last 24h
   - Use CoinGecko: `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=price_change_percentage_24h_desc&per_page=5&page=1`
   - Return top 5 gainers and bottom 5 losers

3. **getSolanaOnchain** — fetch basic Solana network stats
   - Use public Solana RPC: `https://api.mainnet-beta.solana.com`
   - Methods: getEpochInfo, getRecentPerformanceSamples
   - Return: current epoch, TPS (from performance samples), slot height

4. **searchNews** — fetch recent crypto/finance news headlines
   - Use Brave Search API if BRAVE_API_KEY env is set, otherwise use free NewsAPI: `https://newsapi.org/v2/everything?q={query}&sortBy=publishedAt&apiKey={key}`
   - Fallback: if no API key, use a curated RSS endpoint like `https://feeds.feedburner.com/CoinDesk` parsed as text
   - Actually simplest fallback: use `https://cryptopanic.com/api/v1/posts/?auth_token=free&kind=news` (free, no key needed for limited calls)
   - Input: search query string
   - Output: top 5 headlines with source and published time

5. **getMarketSentiment** — compute a simple Fear & Greed style score
   - Use the free Fear & Greed API: `https://api.alternative.me/fng/?limit=1`
   - Return: index value, classification (Fear/Greed/etc), timestamp

### Agent Definition (src/mastra/agents/market-agent/agent.ts)

Create the agent with this system prompt:
```
You are a market intelligence agent specialized in cryptocurrency and financial markets.
You have access to real-time price data, on-chain Solana metrics, news, and market sentiment.

When a user asks about:
- A specific coin → use getCryptoPrice
- Market overview or "what's moving" → use getTopMovers + getMarketSentiment  
- Solana network → use getSolanaOnchain
- News or recent events → use searchNews
- General market vibe → combine getMarketSentiment + getTopMovers

Always provide context, not just numbers. Explain what the data means.
Be concise but insightful. When prices are down, note it factually. When up, same.
Never give financial advice or tell users to buy/sell.
```

### Frontend Customization (src/app/)

Update the UI to match the Market Intelligence theme:
- Change title/heading from "Weather Agent" to "Market Intelligence"
- Update placeholder text in the chat input to something like "Ask about BTC price, top movers, Solana TPS..."
- Keep the chat interface clean — CopilotKit handles the chat UI, minimal changes needed
- Add a small tagline: "Real-time crypto market insights powered by AI"

### Environment Variables

Update .env.example to document:
```
# Required: your LLM provider (OpenAI or Ollama)
OPENAI_API_KEY=your-key-here
# OR for Ollama:
OLLAMA_API_URL=http://127.0.0.1:11434/api
MODEL_NAME_AT_ENDPOINT=qwen3:0.6b

# Optional: enhances news search
BRAVE_API_KEY=optional
```

The agent should work with OPENAI_API_KEY set. Do NOT hardcode any keys.

### README Update

Update README.md to describe the Market Intelligence Agent:
- What it does
- The 5 tools
- How to run locally
- How to configure LLM

## File Structure to Create

```
src/mastra/
  agents/
    market-agent/
      agent.ts          ← agent definition with system prompt + tool bindings
      tools.ts          ← all 5 tool implementations
  index.ts              ← register market-agent (look at how weather-agent is registered)
```

Delete or leave the your-agent/ template folder — don't use it.
Keep weather-agent/ as reference but don't register it if it causes conflicts.

## Constraints

- TypeScript only — match the existing codebase style
- Use fetch() for all HTTP calls — no additional HTTP libraries
- Handle API errors gracefully — if a tool fails, return a clear error message rather than throwing
- All tools must have proper Zod schema input/output definitions (look at weather-agent for pattern)
- Test that `pnpm run dev` starts without errors before finishing
- Do NOT modify package.json to add paid dependencies — use only what's already installed or free APIs
- When done, run `pnpm build` to confirm no TypeScript errors

## Success Criteria

- `pnpm run dev` starts both agent server (port 4111) and UI (port 3000) without errors
- All 5 tools are implemented and callable
- Agent can answer "What's the Bitcoin price?" and "What's moving in crypto today?" correctly
- README updated
- No hardcoded API keys
- `pnpm build` passes clean

When completely done, run:
openclaw system event --text "Done: Nosana market intelligence agent built" --mode now
