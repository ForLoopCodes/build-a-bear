import { MarketSnapshot, RiskSnapshot } from "@build-a-bear/core";
import { normalizeDriftMarketPayload, normalizeDriftRiskPayload } from "./normalizers";
import { DriftApiPayload, DriftRiskPayload, MarketSource, RiskSource } from "./types";

export class DriftDataSource implements MarketSource, RiskSource {
  private readonly marketData: Record<string, DriftApiPayload>;
  private readonly riskData: DriftRiskPayload;

  constructor(
    marketData?: Record<string, DriftApiPayload>,
    riskData?: DriftRiskPayload,
  ) {
    this.marketData = marketData ?? {
      "BTC-PERP": {
        market: "BTC-PERP",
        funding_rate_hourly: 0.00009,
        basis_bps: 11,
        mark_oracle_divergence_bps: 6,
        bid_ask_spread_bps: 2,
        volume_1h: 8_000_000,
        open_interest: 30_000_000,
        volatility_1h: 0.01,
        volatility_24h: 0.045,
        lend_apy: 0.08,
        borrow_apy: 0.11,
        utilization: 0.7,
        estimated_execution_cost_bps: 5,
      },
      "ETH-PERP": {
        market: "ETH-PERP",
        funding_rate_hourly: 0.00012,
        basis_bps: 13,
        mark_oracle_divergence_bps: 8,
        bid_ask_spread_bps: 3,
        volume_1h: 5_500_000,
        open_interest: 18_000_000,
        volatility_1h: 0.013,
        volatility_24h: 0.052,
        lend_apy: 0.08,
        borrow_apy: 0.12,
        utilization: 0.74,
        estimated_execution_cost_bps: 6,
      },
      "SOL-PERP": {
        market: "SOL-PERP",
        funding_rate_hourly: 0.00014,
        basis_bps: 17,
        mark_oracle_divergence_bps: 11,
        bid_ask_spread_bps: 4,
        volume_1h: 4_200_000,
        open_interest: 14_000_000,
        volatility_1h: 0.017,
        volatility_24h: 0.07,
        lend_apy: 0.08,
        borrow_apy: 0.13,
        utilization: 0.79,
        estimated_execution_cost_bps: 8,
      },
    };

    this.riskData = riskData ?? {
      account_health: 74,
      drawdown_daily_pct: -0.01,
      drawdown_rolling_pct: -0.03,
      liquidation_distance_pct: 21,
      telemetry_healthy: true,
    };
  }

  async fetchMarketSnapshots(markets: string[], timestamp: string): Promise<MarketSnapshot[]> {
    return markets
      .filter((market) => this.marketData[market] !== undefined)
      .map((market) => normalizeDriftMarketPayload(this.marketData[market], timestamp));
  }

  async fetchRiskSnapshot(): Promise<RiskSnapshot> {
    return normalizeDriftRiskPayload(this.riskData);
  }
}
