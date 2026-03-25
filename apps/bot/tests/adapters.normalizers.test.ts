import { normalizeDriftMarketPayload, normalizeDriftRiskPayload } from "../src/adapters";

describe("drift payload normalizers", () => {
  it("normalizes and validates market payload", () => {
    const snapshot = normalizeDriftMarketPayload(
      {
        market: "BTC-PERP",
        funding_rate_hourly: 0.0001,
        basis_bps: 12,
        mark_oracle_divergence_bps: 4,
        bid_ask_spread_bps: 2,
        volume_1h: 1_000_000,
        open_interest: 8_000_000,
        volatility_1h: 0.01,
        volatility_24h: 0.04,
        lend_apy: 0.08,
        borrow_apy: 0.1,
        utilization: 0.6,
        estimated_execution_cost_bps: 5,
      },
      "2026-03-25T10:00:00.000Z",
    );

    expect(snapshot.market).toBe("BTC-PERP");
    expect(snapshot.estimatedExecutionCostBps).toBe(5);
  });

  it("throws when utilization is invalid", () => {
    expect(() =>
      normalizeDriftMarketPayload(
        {
          market: "BTC-PERP",
          funding_rate_hourly: 0.0001,
          basis_bps: 12,
          mark_oracle_divergence_bps: 4,
          bid_ask_spread_bps: 2,
          volume_1h: 1_000_000,
          open_interest: 8_000_000,
          volatility_1h: 0.01,
          volatility_24h: 0.04,
          lend_apy: 0.08,
          borrow_apy: 0.1,
          utilization: 1.2,
          estimated_execution_cost_bps: 5,
        },
        "2026-03-25T10:00:00.000Z",
      ),
    ).toThrow();
  });

  it("normalizes and validates risk payload", () => {
    const risk = normalizeDriftRiskPayload({
      account_health: 70,
      drawdown_daily_pct: -0.02,
      drawdown_rolling_pct: -0.04,
      liquidation_distance_pct: 18,
      telemetry_healthy: true,
    });

    expect(risk.accountHealth).toBe(70);
    expect(risk.telemetryHealthy).toBe(true);
  });
});
