import {
  EdgeSignal,
  RiskDecision,
  RiskLevel,
  StrategyState,
} from "@build-a-bear/core";
import { BotConfig } from "../src/config";
import { chooseStrategyState, shouldRebalance } from "../src/strategy";

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

function edges(value: number): EdgeSignal[] {
  return [{ market: "BTC-PERP", expectedNetApy: value, confidence: 0.8 }];
}

describe("strategy router", () => {
  it("chooses safety when risk engine forces it", () => {
    const state = chooseStrategyState(
      edges(0.2),
      { stableCarryProbability: 0.7, unstableCarryProbability: 0.2, riskOffProbability: 0.1 },
      { ...normalRisk, forceSafetyState: true },
      config,
    );

    expect(state.state).toBe(StrategyState.Safety);
  });

  it("chooses carry for stable regime with strong edge", () => {
    const state = chooseStrategyState(
      edges(0.14),
      { stableCarryProbability: 0.8, unstableCarryProbability: 0.1, riskOffProbability: 0.1 },
      normalRisk,
      config,
    );

    expect(state.state).toBe(StrategyState.Carry);
  });

  it("chooses spread for unstable regime with very strong edge", () => {
    const state = chooseStrategyState(
      edges(0.18),
      { stableCarryProbability: 0.2, unstableCarryProbability: 0.7, riskOffProbability: 0.1 },
      normalRisk,
      config,
    );

    expect(state.state).toBe(StrategyState.Spread);
  });

  it("chooses safety when edge is below exit threshold", () => {
    const state = chooseStrategyState(
      edges(0.05),
      { stableCarryProbability: 0.8, unstableCarryProbability: 0.1, riskOffProbability: 0.1 },
      normalRisk,
      config,
    );

    expect(state.state).toBe(StrategyState.Safety);
  });

  it("rebalance decision reacts to state changes and edge", () => {
    expect(shouldRebalance(StrategyState.Safety, StrategyState.Carry, 0.13, config)).toBe(true);
    expect(shouldRebalance(StrategyState.Carry, StrategyState.Carry, 0.07, config)).toBe(false);
    expect(shouldRebalance(StrategyState.Carry, StrategyState.Carry, 0.1, config)).toBe(true);
  });
});
