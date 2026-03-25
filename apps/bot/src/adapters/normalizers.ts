import { marketSnapshotSchema, riskSnapshotSchema, MarketSnapshot, RiskSnapshot } from "@build-a-bear/core";
import { DriftApiPayload, DriftRiskPayload } from "./types";

export function normalizeDriftMarketPayload(
  payload: DriftApiPayload,
  timestamp: string,
): MarketSnapshot {
  return marketSnapshotSchema.parse({
    timestamp,
    market: payload.market,
    fundingRateHourly: payload.funding_rate_hourly,
    basisBps: payload.basis_bps,
    markOracleDivergenceBps: payload.mark_oracle_divergence_bps,
    bidAskSpreadBps: payload.bid_ask_spread_bps,
    volume1h: payload.volume_1h,
    openInterest: payload.open_interest,
    volatility1h: payload.volatility_1h,
    volatility24h: payload.volatility_24h,
    lendApy: payload.lend_apy,
    borrowApy: payload.borrow_apy,
    utilization: payload.utilization,
    estimatedExecutionCostBps: payload.estimated_execution_cost_bps,
  });
}

export function normalizeDriftRiskPayload(payload: DriftRiskPayload): RiskSnapshot {
  return riskSnapshotSchema.parse({
    accountHealth: payload.account_health,
    drawdownDailyPct: payload.drawdown_daily_pct,
    drawdownRollingPct: payload.drawdown_rolling_pct,
    liquidationDistancePct: payload.liquidation_distance_pct,
    telemetryHealthy: payload.telemetry_healthy,
  });
}
