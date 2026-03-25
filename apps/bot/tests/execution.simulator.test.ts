import { RebalanceAction } from "@build-a-bear/core";
import { simulateExecution } from "../src/execution";

const actions: RebalanceAction[] = [
  { market: "BTC-PERP", fromWeight: 0.1, toWeight: 0.2, deltaWeight: 0.1 },
  { market: "ETH-PERP", fromWeight: 0.2, toWeight: 0.1, deltaWeight: -0.1 },
];

describe("execution simulator", () => {
  it("computes gross and net pnl with fees and slippage", () => {
    const summary = simulateExecution(actions, {
      portfolioValue: 100_000,
      feeRateBps: 2,
      slippageRateBps: 3,
      fundingContributionApy: 0.08,
      basisContributionApy: 0.04,
      lendContributionApy: 0.03,
    });

    expect(summary.grossPnl).toBeGreaterThan(0);
    expect(summary.feesPaid).toBeGreaterThan(0);
    expect(summary.slippagePaid).toBeGreaterThan(0);
    expect(summary.netPnl).toBeLessThan(summary.grossPnl);
  });

  it("returns negative net pnl when costs dominate", () => {
    const summary = simulateExecution(actions, {
      portfolioValue: 100_000,
      feeRateBps: 25,
      slippageRateBps: 25,
      fundingContributionApy: 0.01,
      basisContributionApy: 0,
      lendContributionApy: 0,
    });

    expect(summary.netPnl).toBeLessThan(0);
  });

  it("supports empty action list", () => {
    const summary = simulateExecution([], {
      portfolioValue: 50_000,
      feeRateBps: 2,
      slippageRateBps: 2,
      fundingContributionApy: 0.05,
      basisContributionApy: 0.01,
      lendContributionApy: 0.02,
    });

    expect(summary.feesPaid).toBe(0);
    expect(summary.slippagePaid).toBe(0);
    expect(summary.grossPnl).toBeGreaterThan(0);
  });
});
