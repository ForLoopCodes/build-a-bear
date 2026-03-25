import { MarketSnapshot, RiskSnapshot } from "@build-a-bear/core";

export type MarketSource = {
  fetchMarketSnapshots(markets: string[], timestamp: string): Promise<MarketSnapshot[]>;
};

export type RiskSource = {
  fetchRiskSnapshot(): Promise<RiskSnapshot>;
};

export type DriftApiPayload = {
  market: string;
  funding_rate_hourly: number;
  basis_bps: number;
  mark_oracle_divergence_bps: number;
  bid_ask_spread_bps: number;
  volume_1h: number;
  open_interest: number;
  volatility_1h: number;
  volatility_24h: number;
  lend_apy: number;
  borrow_apy: number;
  utilization: number;
  estimated_execution_cost_bps: number;
};

export type DriftRiskPayload = {
  account_health: number;
  drawdown_daily_pct: number;
  drawdown_rolling_pct: number;
  liquidation_distance_pct: number;
  telemetry_healthy: boolean;
};
