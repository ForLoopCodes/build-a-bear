import {
  EdgeSignal,
  RiskDecision,
  RiskLevel,
  StrategyState,
} from "@build-a-bear/core";
import { BotConfig } from "../src/config";
import { buildAllocations } from "../src/allocation";

const config: BotConfig = {
  rpcUrl: "https://rpc",
  fallbackRpcUrl: null,
  rebalanceIntervalMs: 1000,
  signalIntervalMs: 1000,
  healthIntervalMs: 1000,
  reportingIntervalMs: 1000,
  minEntryNetApy: 0.12,
  exitNetApy: 0.08,
  maxGrossExposureMultiplier: 2.2,
  maxMarketWeight: 0.25,
  healthSoftLimit: 55,
  healthHardLimit: 45,
  dailySoftDrawdownPct: -0.05,
  dailyHardDrawdownPct: -0.08,
  rollingHardDrawdownPct: -0.12,
  dryRun: true,
};

const normalRisk: RiskDecision = {
  isTradingAllowed: true,
  riskLevel: RiskLevel.Normal,
  maxGrossExposureMultiplier: 2.2,
  forceSafetyState: false,
  reasons: [],
};

const signals: EdgeSignal[] = [
  { market: "BTC-PERP", expectedNetApy: 0.14, confidence: 0.8 },
  { market: "ETH-PERP", expectedNetApy: 0.12, confidence: 0.9 },
  { market: "SOL-PERP", expectedNetApy: 0.09, confidence: 0.6 },
];

describe("allocation sizer", () => {
  it("returns zero allocations in safety state", () => {
    const allocations = buildAllocations(StrategyState.Safety, signals, normalRisk, config);
    expect(allocations.every((item) => item.targetWeight === 0)).toBe(true);
  });

  it("allocates weights by edge and confidence in carry state", () => {
    const allocations = buildAllocations(StrategyState.Carry, signals, normalRisk, config);
    expect(allocations).toHaveLength(3);
    const btc = allocations.find((item) => item.market === "BTC-PERP");
    const sol = allocations.find((item) => item.market === "SOL-PERP");
    expect(btc?.targetWeight).toBeGreaterThan(sol?.targetWeight ?? 0);
  });

  it("respects max market weight cap", () => {
    const highSignals: EdgeSignal[] = [
      { market: "BTC-PERP", expectedNetApy: 0.4, confidence: 1 },
      { market: "ETH-PERP", expectedNetApy: 0.39, confidence: 1 },
      { market: "SOL-PERP", expectedNetApy: 0.38, confidence: 1 },
    ];
    const allocations = buildAllocations(StrategyState.Carry, highSignals, normalRisk, config);
    expect(allocations.every((item) => item.targetWeight <= config.maxMarketWeight)).toBe(true);
  });

  it("scales down allocations under warning risk profile", () => {
    const warningRisk: RiskDecision = {
      ...normalRisk,
      maxGrossExposureMultiplier: 1.0,
      riskLevel: RiskLevel.Warning,
    };

    const baseline = buildAllocations(StrategyState.Carry, signals, normalRisk, config);
    const reduced = buildAllocations(StrategyState.Carry, signals, warningRisk, config);
    const baselineTotal = baseline.reduce((sum, item) => sum + item.targetWeight, 0);
    const reducedTotal = reduced.reduce((sum, item) => sum + item.targetWeight, 0);
    expect(reducedTotal).toBeLessThan(baselineTotal);
  });
});
