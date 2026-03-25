import { StrategyState } from "@build-a-bear/core";
import { BotConfig } from "../src/config";
import { runSingleCycle } from "../src/runtime";

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

describe("runtime orchestrator", () => {
  it("runs single decision cycle end-to-end", async () => {
    const output = await runSingleCycle(
      {
        markets: ["BTC-PERP", "ETH-PERP", "SOL-PERP"],
        previousState: StrategyState.Safety,
        currentAllocations: [
          { market: "BTC-PERP", targetWeight: 0 },
          { market: "ETH-PERP", targetWeight: 0 },
          { market: "SOL-PERP", targetWeight: 0 },
        ],
      },
      config,
    );

    expect([StrategyState.Safety, StrategyState.Carry, StrategyState.Spread]).toContain(output.nextState);
    expect(Array.isArray(output.actions)).toBe(true);
    expect(output.reportText).toContain("netApy");
  });
});
