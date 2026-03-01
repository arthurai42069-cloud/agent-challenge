# Market Intelligence Agent — Nosana Builders Challenge

A real-time cryptocurrency market intelligence agent built with [Mastra](https://mastra.ai) and deployed on the [Nosana](https://nosana.com) decentralized GPU network.

## What It Does

Ask the agent anything about crypto markets in natural language. It pulls live data from multiple sources and synthesizes it into clear, contextual answers.

### Tools

| Tool | Description |
|------|-------------|
| `getCryptoPriceTool` | Live price + 24h change for any coin (BTC, ETH, SOL, etc.) |
| `getTopMoversTool` | Top 5 gainers and losers in the last 24 hours |
| `getSolanaOnchainTool` | Real-time Solana TPS, epoch, and slot height |
| `getNewsTool` | Latest crypto news headlines (CryptoPanic) |
| `getMarketSentimentTool` | Fear & Greed Index with contextual interpretation |

### Example Queries

- *"What's the Bitcoin price right now?"*
- *"What's moving in crypto today?"*
- *"How's the Solana network performing?"*
- *"What's the overall market sentiment?"*
- *"Any news on Ethereum?"*
- *"Give me a full market overview"*

## Stack

- **Agent framework:** [Mastra](https://mastra.ai) (TypeScript)
- **Frontend:** Next.js 15 + [CopilotKit](https://copilotkit.ai)
- **Deployment:** [Nosana](https://nosana.com) decentralized GPU compute
- **Data sources:** CoinGecko (free), Solana RPC, CryptoPanic, Alternative.me Fear & Greed

## Running Locally

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- An OpenAI API key **or** [Ollama](https://ollama.com) running locally

### Setup

```bash
# Clone the repo
git clone https://github.com/arthurai42069-cloud/agent-challenge
cd agent-challenge

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env and add your LLM credentials (see below)

# Start development servers
pnpm run dev:agent   # Mastra agent server on port 4111
pnpm run dev:ui      # Next.js frontend on port 3000
```

Open [http://localhost:3000](http://localhost:3000) and start chatting.

### Environment Variables

```env
# Option 1: OpenAI
OPENAI_API_KEY=your-openai-api-key

# Option 2: Ollama (local)
OLLAMA_API_URL=http://127.0.0.1:11434/api
MODEL_NAME_AT_ENDPOINT=qwen3:8b

# Optional: override model when running on Nosana
NOS_OLLAMA_API_URL=http://localhost:11434/api
NOS_MODEL_NAME_AT_ENDPOINT=qwen3:8b
```

All data APIs (CoinGecko, Solana RPC, CryptoPanic, Fear & Greed) are free and require no API keys.

## Deployment on Nosana

```bash
# Build Docker image
docker build -t yourusername/nosana-market-agent:latest .

# Deploy using Nosana job definition
nosana job submit --file nos_job_def/nosana_mastra.yml
```

See the [Nosana docs](https://docs.nosana.com) for full deployment instructions.

## Architecture

```
User ──→ Next.js UI (CopilotKit) ──→ /api/copilotkit ──→ Mastra Agent
                                                              │
                                          ┌───────────────────┤
                                          ▼                   ▼
                                    CoinGecko API      Solana RPC
                                    CryptoPanic        Fear&Greed API
```

The agent uses Mastra's tool-calling system to fetch real-time data and synthesize responses. All API calls include error handling — if a source is unavailable, the agent continues with available data.

## License

MIT
