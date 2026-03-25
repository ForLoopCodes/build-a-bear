import { MarketSnapshot, marketSnapshotSchema } from "@build-a-bear/core";
import axios from "axios";

type Kline = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string,
];

const SPOT_BASE = "https://api.binance.com/api/v3";
const FUTURES_BASE = "https://fapi.binance.com/fapi/v1";

function mapMarketToSymbol(market: string): string {
  if (market === "BTC-PERP") return "BTCUSDT";
  if (market === "ETH-PERP") return "ETHUSDT";
  if (market === "SOL-PERP") return "SOLUSDT";
  return market.replace("-PERP", "USDT");
}

async function fetchKline(baseUrl: string, symbol: string): Promise<Kline> {
  const response = await axios.get<Kline[]>(`${baseUrl}/klines`, {
    params: { symbol, interval: "1h", limit: 1 },
    timeout: 20_000,
  });
  if (!response.data.length) {
    throw new Error(`Missing kline response for ${symbol}`);
  }
  return response.data[0];
}

async function fetchFundingRate(symbol: string): Promise<number> {
  const response = await axios.get<Array<{ fundingRate: string }>>(`${FUTURES_BASE}/fundingRate`, {
    params: { symbol, limit: 1 },
    timeout: 20_000,
  });
  return response.data.length ? Number(response.data[0].fundingRate) / 8 : 0;
}

async function fetchOpenInterest(symbol: string): Promise<number> {
  const response = await axios.get<Array<{ sumOpenInterestValue: string }>>(
    "https://fapi.binance.com/futures/data/openInterestHist",
    {
      params: { symbol, period: "1h", limit: 1 },
      timeout: 20_000,
    },
  );
  return response.data.length ? Number(response.data[0].sumOpenInterestValue) : 0;
}

export async function fetchLiveMarketSnapshots(markets: string[]): Promise<MarketSnapshot[]> {
  const timestamp = new Date().toISOString();

  const snapshots = await Promise.all(markets.map(async (market) => {
    const symbol = mapMarketToSymbol(market);
    const [futuresKline, spotKline, fundingRateHourly, openInterest] = await Promise.all([
      fetchKline(FUTURES_BASE, symbol),
      fetchKline(SPOT_BASE, symbol),
      fetchFundingRate(symbol),
      fetchOpenInterest(symbol),
    ]);

    const futuresClose = Number(futuresKline[4]);
    const spotClose = Number(spotKline[4]);
    const high = Number(futuresKline[2]);
    const low = Number(futuresKline[3]);
    const quoteVolume = Number(futuresKline[7]);

    const basisBps = spotClose > 0 ? (futuresClose - spotClose) / spotClose * 10_000 : 0;
    const markOracleDivergenceBps = Math.abs(basisBps);
    const bidAskSpreadBps = Math.max(0.5, Math.abs(high - low) / Math.max(futuresClose, 1e-9) * 1000);
    const volatility1h = Math.max(0.0001, Math.abs(high - low) / Math.max(futuresClose, 1e-9));
    const volatility24h = volatility1h * 2.5;
    const utilization = Math.min(0.98, Math.max(0.2, 0.55 + volatility24h * 2));
    const lendApy = Math.min(0.2, Math.max(0.02, 0.05 + Math.abs(fundingRateHourly) * 30));
    const borrowApy = Math.min(0.3, Math.max(lendApy + 0.015, lendApy + utilization * 0.08));
    const estimatedExecutionCostBps = Math.min(30, Math.max(1, bidAskSpreadBps * 0.8));

    return marketSnapshotSchema.parse({
      timestamp,
      market,
      fundingRateHourly,
      basisBps,
      markOracleDivergenceBps,
      bidAskSpreadBps,
      volume1h: Math.max(quoteVolume, 0),
      openInterest: Math.max(openInterest, 0),
      volatility1h,
      volatility24h,
      lendApy,
      borrowApy,
      utilization,
      estimatedExecutionCostBps,
      referencePrice: spotClose,
    });
  }));

  return snapshots;
}
