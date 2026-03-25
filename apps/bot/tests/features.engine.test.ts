import { MarketSnapshot } from "@build-a-bear/core";
import { buildFeatureVectors } from "../src/features";

function makeSnapshot(overrides: Partial<MarketSnapshot>): MarketSnapshot {
  return {
    timestamp: "2026-03-25T00:00:00.000Z",
    market: "BTC-PERP",
    fundingRateHourly: 0.0001,
    basisBps: 10,
    markOracleDivergenceBps: 5,
    bidAskSpreadBps: 3,
    volume1h: 1_000_000,
    openInterest: 10_000_000,
    volatility1h: 0.01,
    volatility24h: 0.05,
    lendApy: 0.08,
    borrowApy: 0.1,
    utilization: 0.7,
    estimatedExecutionCostBps: 5,
    ...overrides,
  };
}

describe("feature engine", () => {
  it("builds features with momentum and z-score", () => {
    const latest = [
      makeSnapshot({
        timestamp: "2026-03-25T04:00:00.000Z",
        fundingRateHourly: 0.0002,
        basisBps: 16,
      }),
    ];

    const history = [
      makeSnapshot({ timestamp: "2026-03-25T00:00:00.000Z", fundingRateHourly: 0.0001, basisBps: 8 }),
      makeSnapshot({ timestamp: "2026-03-25T01:00:00.000Z", fundingRateHourly: 0.00012, basisBps: 9 }),
      makeSnapshot({ timestamp: "2026-03-25T02:00:00.000Z", fundingRateHourly: 0.00015, basisBps: 11 }),
      makeSnapshot({ timestamp: "2026-03-25T03:00:00.000Z", fundingRateHourly: 0.00018, basisBps: 14 }),
    ];

    const vectors = buildFeatureVectors(latest, history);

    expect(vectors).toHaveLength(1);
    expect(vectors[0].fundingMomentum4h).toBeCloseTo(0.00008, 8);
    expect(vectors[0].basisZScore24h).toBeGreaterThan(0);
    expect(vectors[0].carryEdgeApy).toBeGreaterThan(0);
  });

  it("handles sparse history", () => {
    const latest = [makeSnapshot({ market: "ETH-PERP", fundingRateHourly: 0.00005 })];
    const vectors = buildFeatureVectors(latest, []);
    expect(vectors).toHaveLength(1);
    expect(vectors[0].fundingMomentum4h).toBe(0);
  });

  it("generates one vector per latest market snapshot", () => {
    const latest = [
      makeSnapshot({ market: "BTC-PERP" }),
      makeSnapshot({ market: "ETH-PERP", fundingRateHourly: 0.0002, basisBps: 18 }),
    ];
    const vectors = buildFeatureVectors(latest, []);
    expect(vectors.map((item) => item.market).sort()).toEqual(["BTC-PERP", "ETH-PERP"]);
  });
});
