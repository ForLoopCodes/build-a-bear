import axios from "axios";
import { BN } from "bn.js";
import { DRIFT_DATA_API, FUNDING_RATE_PRECISION, YEAR_SECONDS, HOUR_SECONDS } from "../config.js";
import type { MarketFunding, FundingRateSnapshot, DriftMarketData } from "../types.js";

export class DriftApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = DRIFT_DATA_API) {
    this.baseUrl = baseUrl;
  }

  async getAllPerpMarkets(): Promise<MarketFunding[]> {
    const markets: MarketFunding[] = [];
    for (let i = 0; i <= 6; i++) {
      const data = await this.getPerpMarket(i);
      if (data?.perpMarketAccount) {
        const acc = data.perpMarketAccount;
        const hourlyRate = new BN(acc.record?.fundingRate || "0");
        const annualized = this.hourlyToAnnualized(hourlyRate);
        markets.push({
          marketIndex: acc.marketIndex,
          symbol: this.getSymbol(acc.marketIndex),
          fundingRateHourly: hourlyRate,
          fundingRateAnnualized: annualized,
          openInterest: new BN(acc.record?.openInterest || "0"),
          openInterestLong: new BN(acc.record?.openInterestLong || "0"),
          openInterestShort: new BN(acc.record?.openInterestShort || "0"),
          lastUpdate: Date.now(),
          oraclePrice: new BN(0),
          marketDepth: Number(acc.amm?.quoteAssetReserve || 0) / 1e6,
        });
      }
    }
    return markets;
  }

  async getPerpMarket(marketIndex: number): Promise<DriftMarketData | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/v2/perp/market/${marketIndex}`, {
        timeout: 5000,
        headers: { "Accept": "application/json" },
      });
      return response.data;
    } catch {
      return null;
    }
  }

  async getFundingRateHistory(marketIndex: number, hours: number = 24): Promise<FundingRateSnapshot[]> {
    try {
      const end = Math.floor(Date.now() / 1000);
      const start = end - hours * HOUR_SECONDS;
      const response = await axios.get(`${this.baseUrl}/v2/perp/funding/history/${marketIndex}`, {
        params: { start, end },
        timeout: 5000,
      });
      return (response.data?.snapshots || []).map((s: { marketIndex: number; rate: string; timestamp: number }) => ({
        marketIndex: s.marketIndex,
        rate: s.rate,
        timestamp: s.timestamp,
        direction: Number(s.rate) >= 0 ? "positive" as const : "negative" as const,
      }));
    } catch {
      return [];
    }
  }

  async getMarketOraclePrice(marketIndex: number): Promise<BN | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/v2/oracle/${marketIndex}`, { timeout: 5000 });
      return new BN(response.data?.price || "0");
    } catch {
      return null;
    }
  }

  hourlyToAnnualized(hourlyRate: BN): number {
    const hourlyDecimal = Number(hourlyRate) / FUNDING_RATE_PRECISION;
    return hourlyDecimal * YEAR_SECONDS / HOUR_SECONDS * 100;
  }

  annualizedToHourly(annualizedPercent: number): BN {
    const hourlyDecimal = (annualizedPercent / 100) * HOUR_SECONDS / YEAR_SECONDS;
    return new BN(Math.floor(hourlyDecimal * FUNDING_RATE_PRECISION));
  }

  private getSymbol(index: number): string {
    const symbols = ["SOL", "BTC", "ETH", "ARB", "AVAX", "LINK", "MATIC"];
    return symbols[index] || `MKT${index}`;
  }
}
