import { RiskSnapshot, RiskLevel } from "@build-a-bear/core";
import { BotConfig } from "../src/config";
import { evaluateRiskPolicy } from "../src/risk";

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

function makeRisk(overrides: Partial<RiskSnapshot>): RiskSnapshot {
  return {
    accountHealth: 80,
    drawdownDailyPct: -0.01,
    drawdownRollingPct: -0.02,
    liquidationDistancePct: 20,
    telemetryHealthy: true,
    ...overrides,
  };
}

describe("risk policy", () => {
  it("returns normal risk when everything is healthy", () => {
    const decision = evaluateRiskPolicy(makeRisk({}), config);
    expect(decision.riskLevel).toBe(RiskLevel.Normal);
    expect(decision.isTradingAllowed).toBe(true);
    expect(decision.maxGrossExposureMultiplier).toBe(2.2);
  });

  it("returns warning when soft limits are breached", () => {
    const decision = evaluateRiskPolicy(
      makeRisk({ accountHealth: 54, drawdownDailyPct: -0.055 }),
      config,
    );

    expect(decision.riskLevel).toBe(RiskLevel.Warning);
    expect(decision.isTradingAllowed).toBe(true);
    expect(decision.maxGrossExposureMultiplier).toBe(1.0);
  });

  it("returns critical when hard limits are breached", () => {
    const decision = evaluateRiskPolicy(
      makeRisk({ accountHealth: 44, drawdownDailyPct: -0.1 }),
      config,
    );

    expect(decision.riskLevel).toBe(RiskLevel.Critical);
    expect(decision.isTradingAllowed).toBe(false);
    expect(decision.forceSafetyState).toBe(true);
  });

  it("returns critical when telemetry is unhealthy", () => {
    const decision = evaluateRiskPolicy(makeRisk({ telemetryHealthy: false }), config);
    expect(decision.riskLevel).toBe(RiskLevel.Critical);
    expect(decision.reasons).toContain("Telemetry feed unhealthy");
  });
});
