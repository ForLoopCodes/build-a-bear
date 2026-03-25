import {
  StrategyState,
  RiskLevel,
  marketSnapshotSchema,
  riskSnapshotSchema,
  edgeSignalSchema,
  regimeSignalSchema,
  allocationTargetSchema,
  rebalanceActionSchema,
} from "../src";

describe("domain types and validators", () => {
  it("validates market snapshots", () => {
    expect(() =>
      marketSnapshotSchema.parse({
        timestamp: "2026-03-25T00:00:00.000Z",
        market: "BTC-PERP",
        fundingRateHourly: 0.0001,
        basisBps: 12,
        markOracleDivergenceBps: 5,
        bidAskSpreadBps: 3,
        volume1h: 5000000,
        openInterest: 20000000,
        volatility1h: 0.012,
        volatility24h: 0.05,
        lendApy: 0.08,
        borrowApy: 0.11,
        utilization: 0.72,
        estimatedExecutionCostBps: 6,
      }),
    ).not.toThrow();
  });

  it("rejects invalid risk snapshots", () => {
    expect(() =>
      riskSnapshotSchema.parse({
        accountHealth: 120,
        drawdownDailyPct: -1,
        drawdownRollingPct: -2,
        liquidationDistancePct: 15,
        telemetryHealthy: true,
      }),
    ).toThrow();
  });

  it("validates edge and regime signals", () => {
    expect(() =>
      edgeSignalSchema.parse({
        market: "ETH-PERP",
        expectedNetApy: 0.14,
        confidence: 0.78,
      }),
    ).not.toThrow();

    expect(() =>
      regimeSignalSchema.parse({
        stableCarryProbability: 0.65,
        unstableCarryProbability: 0.22,
        riskOffProbability: 0.13,
      }),
    ).not.toThrow();
  });

  it("validates allocation and rebalance action payloads", () => {
    expect(() =>
      allocationTargetSchema.parse({
        market: "SOL-PERP",
        targetWeight: 0.2,
      }),
    ).not.toThrow();

    expect(() =>
      rebalanceActionSchema.parse({
        market: "BTC-PERP",
        fromWeight: 0.15,
        toWeight: 0.2,
        deltaWeight: 0.05,
      }),
    ).not.toThrow();
  });

  it("exports expected enums", () => {
    expect(StrategyState.Safety).toBe("safety");
    expect(RiskLevel.Critical).toBe("critical");
  });
});
