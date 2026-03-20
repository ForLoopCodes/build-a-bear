import { BN } from "bn.js";
import { RiskManager } from "../src/risk/manager.js";
import { FundingOptimizer } from "../src/strategies/optimizer.js";
import { DriftApiClient } from "../src/api/drift.js";
import { DRIFT_MARKETS, MarketFunding, Allocation, DEFAULT_RISK_PARAMS } from "../src/types.js";

describe("RiskManager", () => {
  let riskManager: RiskManager;

  beforeEach(() => {
    riskManager = new RiskManager(DEFAULT_RISK_PARAMS);
    riskManager.updatePeak(new BN(1_000_000_000_000));
  });

  test("drawdown calculation is accurate", () => {
    const current = new BN(950_000_000_000);
    const drawdown = riskManager.checkDrawdown(current);
    expect(drawdown).toBeCloseTo(0.05, 2);
  });

  test("circuit breaker triggers at threshold", () => {
    const current = new BN(920_000_000_000);
    expect(riskManager.isCircuitBreakerTriggered(current)).toBe(true);
  });

  test("position validation passes within limits", () => {
    const position = {
      marketIndex: 0,
      symbol: "SOL",
      direction: "long" as const,
      size: new BN(200_000_000_000),
      entryPrice: new BN(150_000_000),
      currentPrice: new BN(150_000_000),
      unrealizedPnl: new BN(0),
      fundingAccrued: new BN(0),
      timestamp: Date.now(),
    };
    const vaultValue = new BN(1_000_000_000_000);
    const result = riskManager.validatePosition(position, vaultValue);
    expect(result.valid).toBe(true);
  });

  test("position validation fails over max allocation", () => {
    const position = {
      marketIndex: 0,
      symbol: "SOL",
      direction: "long" as const,
      size: new BN(300_000_000_000),
      entryPrice: new BN(150_000_000),
      currentPrice: new BN(150_000_000),
      unrealizedPnl: new BN(0),
      fundingAccrued: new BN(0),
      timestamp: Date.now(),
    };
    const vaultValue = new BN(1_000_000_000_000);
    const result = riskManager.validatePosition(position, vaultValue);
    expect(result.valid).toBe(false);
  });

  test("rebalance threshold works correctly", () => {
    const allocations: Allocation[] = [
      { marketIndex: 0, symbol: "SOL", targetPercent: 0.30, currentPercent: 0.30, direction: "long", estimatedApy: 25, score: 0.8 },
    ];
    const check = riskManager.validateRebalance(allocations, Date.now());
    expect(check.shouldRebalance).toBe(false);
  });
});

describe("FundingOptimizer", () => {
  let optimizer: FundingOptimizer;

  beforeEach(() => {
    optimizer = new FundingOptimizer(DRIFT_MARKETS);
  });

  test("analyzes markets and returns ranked scores", () => {
    const marketData: MarketFunding[] = [
      {
        marketIndex: 0,
        symbol: "SOL",
        fundingRateHourly: new BN(8000),
        fundingRateAnnualized: 28,
        openInterest: new BN(500_000_000_000_000),
        openInterestLong: new BN(300_000_000_000_000),
        openInterestShort: new BN(200_000_000_000_000),
        lastUpdate: Date.now(),
        oraclePrice: new BN(150_000_000),
        marketDepth: 10_000_000_000,
      },
      {
        marketIndex: 1,
        symbol: "BTC",
        fundingRateHourly: new BN(5000),
        fundingRateAnnualized: 18,
        openInterest: new BN(1_000_000_000_000_000),
        openInterestLong: new BN(600_000_000_000_000),
        openInterestShort: new BN(400_000_000_000_000),
        lastUpdate: Date.now(),
        oraclePrice: new BN(95_000_000_000),
        marketDepth: 20_000_000_000,
      },
    ];

    const scores = optimizer.analyzeMarkets(marketData);
    expect(scores.length).toBe(2);
    expect(scores[0].symbol).toBe("SOL");
    expect(scores[0].totalScore).toBeGreaterThan(scores[1].totalScore);
  });

  test("calculates optimal allocation across markets", () => {
    const scores = [
      { marketIndex: 0, symbol: "SOL", fundingScore: 0.8, stabilityScore: 0.7, depthScore: 0.6, totalScore: 0.75, direction: "long" as const, estimatedApy: 28 },
      { marketIndex: 1, symbol: "BTC", fundingScore: 0.5, stabilityScore: 0.9, depthScore: 0.9, totalScore: 0.65, direction: "short" as const, estimatedApy: 18 },
    ];

    const vaultValue = new BN(1_000_000_000_000);
    const allocations = optimizer.calculateOptimalAllocation(scores, vaultValue, []);

    expect(allocations.length).toBeGreaterThan(0);
    const totalAlloc = allocations.reduce((sum, a) => sum + a.targetPercent, 0);
    expect(totalAlloc).toBeLessThanOrEqual(1);
    expect(totalAlloc).toBeGreaterThan(0.5);
  });

  test("rebalance detection works", () => {
    const current: Allocation[] = [
      { marketIndex: 0, symbol: "SOL", targetPercent: 0.30, currentPercent: 0.30, direction: "long", estimatedApy: 25, score: 0.8 },
    ];
    const target: Allocation[] = [
      { marketIndex: 0, symbol: "SOL", targetPercent: 0.50, currentPercent: 0.30, direction: "long", estimatedApy: 25, score: 0.8 },
    ];

    const result = optimizer.shouldRebalance(current, target, 0.05);
    expect(result.should).toBe(true);
    expect(result.changes.length).toBe(1);
  });
});

describe("DriftApiClient", () => {
  let client: DriftApiClient;

  beforeEach(() => {
    client = new DriftApiClient();
  });

  test("hourly to annualized conversion", () => {
    const hourly = new BN(8000);
    const annualized = client.hourlyToAnnualized(hourly);
    expect(annualized).toBeCloseTo(70.08, 0);
  });

  test("annualized to hourly conversion", () => {
    const hourly = client.annualizedToHourly(28);
    const annualizedBack = client.hourlyToAnnualized(hourly);
    expect(annualizedBack).toBeCloseTo(28, 0);
  });
});
