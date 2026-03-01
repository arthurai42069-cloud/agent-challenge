import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// ─── Crypto Price ────────────────────────────────────────────────────────────

const COIN_ALIASES: Record<string, string> = {
  btc: 'bitcoin', eth: 'ethereum', sol: 'solana', bnb: 'binancecoin',
  xrp: 'ripple', ada: 'cardano', avax: 'avalanche-2', dot: 'polkadot',
  link: 'chainlink', matic: 'polygon-ecosystem-token', doge: 'dogecoin',
  shib: 'shiba-inu', uni: 'uniswap', atom: 'cosmos', near: 'near',
};

function normalizeCoinId(input: string): string {
  const key = input.toLowerCase().trim();
  return COIN_ALIASES[key] || key;
}

export const getCryptoPriceTool = createTool({
  id: 'get-crypto-price',
  description: 'Get current price and 24h change for any cryptocurrency',
  inputSchema: z.object({
    coin: z.string().describe('Coin name or ticker (e.g. bitcoin, BTC, solana, SOL)'),
  }),
  outputSchema: z.object({
    coin: z.string(),
    price_usd: z.number(),
    change_24h_pct: z.number(),
    market_cap_usd: z.number().nullable(),
    found: z.boolean(),
    error: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const id = normalizeCoinId(context.coin);
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`,
        { headers: { Accept: 'application/json' } }
      );
      const data = await res.json() as Record<string, Record<string, number>>;
      if (!data[id]) {
        return { coin: context.coin, price_usd: 0, change_24h_pct: 0, market_cap_usd: null, found: false, error: `Coin "${context.coin}" not found` };
      }
      return {
        coin: id,
        price_usd: data[id].usd,
        change_24h_pct: data[id].usd_24h_change ?? 0,
        market_cap_usd: data[id].usd_market_cap ?? null,
        found: true,
      };
    } catch (e) {
      return { coin: context.coin, price_usd: 0, change_24h_pct: 0, market_cap_usd: null, found: false, error: String(e) };
    }
  },
});

// ─── Top Movers ──────────────────────────────────────────────────────────────

const MoverSchema = z.object({
  name: z.string(),
  symbol: z.string(),
  price_usd: z.number(),
  change_24h_pct: z.number(),
});

export const getTopMoversTool = createTool({
  id: 'get-top-movers',
  description: 'Get the top 5 biggest gainers and losers in crypto in the last 24 hours',
  inputSchema: z.object({}),
  outputSchema: z.object({
    gainers: z.array(MoverSchema),
    losers: z.array(MoverSchema),
    error: z.string().optional(),
  }),
  execute: async () => {
    try {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&price_change_percentage=24h',
        { headers: { Accept: 'application/json' } }
      );
      const coins = await res.json() as Array<{
        name: string; symbol: string; current_price: number;
        price_change_percentage_24h: number;
      }>;
      const sorted = [...coins].sort((a, b) =>
        (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0)
      );
      const map = (c: typeof sorted[0]) => ({
        name: c.name, symbol: c.symbol.toUpperCase(),
        price_usd: c.current_price,
        change_24h_pct: c.price_change_percentage_24h ?? 0,
      });
      return { gainers: sorted.slice(0, 5).map(map), losers: sorted.slice(-5).reverse().map(map) };
    } catch (e) {
      return { gainers: [], losers: [], error: String(e) };
    }
  },
});

// ─── Solana Onchain Stats ────────────────────────────────────────────────────

export const getSolanaOnchainTool = createTool({
  id: 'get-solana-onchain',
  description: 'Get live Solana network stats: TPS, current epoch, slot height',
  inputSchema: z.object({}),
  outputSchema: z.object({
    tps: z.number().nullable(),
    slot: z.number().nullable(),
    epoch: z.number().nullable(),
    epoch_progress_pct: z.number().nullable(),
    error: z.string().optional(),
  }),
  execute: async () => {
    const rpc = 'https://api.mainnet-beta.solana.com';
    const post = async (method: string, params: unknown[] = []) => {
      const r = await fetch(rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      });
      return (await r.json() as { result: unknown }).result;
    };
    try {
      const [epochInfo, perf] = await Promise.all([
        post('getEpochInfo') as Promise<{ epoch: number; slotIndex: number; slotsInEpoch: number; absoluteSlot: number }>,
        post('getRecentPerformanceSamples', [5]) as Promise<Array<{ numTransactions: number; samplePeriodSecs: number }>>,
      ]);
      const tps = perf?.length
        ? Math.round(perf.reduce((s, p) => s + p.numTransactions / p.samplePeriodSecs, 0) / perf.length)
        : null;
      return {
        tps,
        slot: epochInfo?.absoluteSlot ?? null,
        epoch: epochInfo?.epoch ?? null,
        epoch_progress_pct: epochInfo
          ? Math.round((epochInfo.slotIndex / epochInfo.slotsInEpoch) * 100)
          : null,
      };
    } catch (e) {
      return { tps: null, slot: null, epoch: null, epoch_progress_pct: null, error: String(e) };
    }
  },
});

// ─── News Headlines ──────────────────────────────────────────────────────────

const NewsItemSchema = z.object({
  title: z.string(),
  source: z.string(),
  url: z.string(),
  published_at: z.string(),
});

export const getNewsTool = createTool({
  id: 'get-news',
  description: 'Fetch the latest crypto/finance news headlines for a given topic',
  inputSchema: z.object({
    query: z.string().describe('Search topic, e.g. "bitcoin", "solana", "DeFi"'),
  }),
  outputSchema: z.object({
    articles: z.array(NewsItemSchema),
    error: z.string().optional(),
  }),
  execute: async ({ context }) => {
    try {
      // CryptoPanic free API — no key needed for limited calls
      const res = await fetch(
        `https://cryptopanic.com/api/v1/posts/?auth_token=free&kind=news&filter=hot&currencies=${encodeURIComponent(context.query)}`,
        { headers: { Accept: 'application/json' } }
      );
      const data = await res.json() as { results?: Array<{ title: string; source: { title: string }; url: string; published_at: string }> };
      if (data.results?.length) {
        return {
          articles: data.results.slice(0, 5).map(a => ({
            title: a.title,
            source: a.source?.title ?? 'Unknown',
            url: a.url,
            published_at: a.published_at,
          })),
        };
      }
      // Fallback: general search
      const res2 = await fetch(
        `https://cryptopanic.com/api/v1/posts/?auth_token=free&kind=news&filter=hot`,
        { headers: { Accept: 'application/json' } }
      );
      const data2 = await res2.json() as typeof data;
      return {
        articles: (data2.results ?? []).slice(0, 5).map(a => ({
          title: a.title,
          source: a.source?.title ?? 'Unknown',
          url: a.url,
          published_at: a.published_at,
        })),
      };
    } catch (e) {
      return { articles: [], error: String(e) };
    }
  },
});

// ─── Fear & Greed Index ──────────────────────────────────────────────────────

export const getMarketSentimentTool = createTool({
  id: 'get-market-sentiment',
  description: 'Get the current Crypto Fear & Greed Index score and classification',
  inputSchema: z.object({}),
  outputSchema: z.object({
    value: z.number().nullable(),
    classification: z.string().nullable(),
    timestamp: z.string().nullable(),
    description: z.string().nullable(),
    error: z.string().optional(),
  }),
  execute: async () => {
    try {
      const res = await fetch('https://api.alternative.me/fng/?limit=1', {
        headers: { Accept: 'application/json' },
      });
      const data = await res.json() as { data?: Array<{ value: string; value_classification: string; timestamp: string }> };
      const item = data.data?.[0];
      if (!item) return { value: null, classification: null, timestamp: null, description: null, error: 'No data' };
      const val = parseInt(item.value);
      let description = '';
      if (val <= 25) description = 'Markets are in extreme fear — historically a potential buying opportunity, but tread carefully.';
      else if (val <= 45) description = 'Fearful market — investors are nervous. Dips may continue.';
      else if (val <= 55) description = 'Neutral sentiment — market is balanced, no strong directional signal.';
      else if (val <= 75) description = 'Greedy market — momentum is up but watch for overextension.';
      else description = 'Extreme greed — markets may be overheated. Historically a sign to be cautious.';
      return {
        value: val,
        classification: item.value_classification,
        timestamp: new Date(parseInt(item.timestamp) * 1000).toISOString(),
        description,
      };
    } catch (e) {
      return { value: null, classification: null, timestamp: null, description: null, error: String(e) };
    }
  },
});

// ─── Weather tool kept for compatibility ─────────────────────────────────────
export { getCryptoPriceTool as weatherTool }; // alias so existing imports don't break
