import "dotenv/config";
import { openai } from "@ai-sdk/openai";
import { createOllama } from "ollama-ai-provider-v2";
import { Agent } from "@mastra/core/agent";
import {
  getCryptoPriceTool,
  getTopMoversTool,
  getSolanaOnchainTool,
  getNewsTool,
  getMarketSentimentTool,
} from "@/mastra/tools";
import { LibSQLStore } from "@mastra/libsql";
import { Memory } from "@mastra/memory";

const ollama = createOllama({
  baseURL: process.env.NOS_OLLAMA_API_URL || process.env.OLLAMA_API_URL,
});

function getModel() {
  if (process.env.OPENAI_API_KEY) {
    return openai("gpt-4o-mini");
  }
  return ollama(
    process.env.NOS_MODEL_NAME_AT_ENDPOINT ||
    process.env.MODEL_NAME_AT_ENDPOINT ||
    "qwen3:8b"
  );
}

export const marketAgent = new Agent({
  name: "Market Intelligence Agent",
  tools: {
    getCryptoPriceTool,
    getTopMoversTool,
    getSolanaOnchainTool,
    getNewsTool,
    getMarketSentimentTool,
  },
  model: getModel(),
  instructions: `You are a market intelligence agent specialized in cryptocurrency and financial markets.
You have access to real-time price data, Solana on-chain metrics, news headlines, and market sentiment.

Use your tools proactively based on what the user asks:
- Specific coin price → getCryptoPriceTool
- "What's moving" or top movers → getTopMoversTool + getMarketSentimentTool
- Solana network stats → getSolanaOnchainTool
- News or recent events → getNewsTool
- Overall market vibe → getMarketSentimentTool + getTopMoversTool
- General crypto overview → combine multiple tools for a full picture

Guidelines:
- Always provide context, not just raw numbers. Explain what the data means.
- Be concise but insightful. Format prices clearly (e.g. $67,432.50).
- When asked about multiple things, call multiple tools.
- Never give financial advice or tell users to buy or sell anything.
- If a tool returns an error, acknowledge it and provide what you can.
- Format your responses clearly with bold labels where helpful.`,
  description: "Real-time crypto market intelligence: prices, movers, Solana on-chain stats, news, and sentiment.",
  memory: new Memory({
    storage: new LibSQLStore({ url: "file::memory:" }),
    options: {
      workingMemory: { enabled: true },
    },
  }),
});

// Keep weatherAgent export for compatibility with existing imports
export const weatherAgent = marketAgent;
