import { RebalanceAction, SimulationSummary } from "@build-a-bear/core";

export type SimulationConfig = {
  portfolioValue: number;
  feeRateBps: number;
  slippageRateBps: number;
  fundingContributionApy: number;
  basisContributionApy: number;
  lendContributionApy: number;
};

function bpsToRatio(value: number): number {
  return value / 10_000;
}

export function simulateExecution(
  actions: RebalanceAction[],
  config: SimulationConfig,
): SimulationSummary {
  const tradedNotional = actions.reduce(
    (sum, action) => sum + Math.abs(action.deltaWeight) * config.portfolioValue,
    0,
  );

  const feesPaid = tradedNotional * bpsToRatio(config.feeRateBps);
  const slippagePaid = tradedNotional * bpsToRatio(config.slippageRateBps);

  const grossApy =
    config.fundingContributionApy +
    config.basisContributionApy +
    config.lendContributionApy;

  const grossPnl = config.portfolioValue * grossApy / 365;
  const netPnl = grossPnl - feesPaid - slippagePaid;
  const realizedNetApy = (netPnl * 365) / config.portfolioValue;

  return {
    grossPnl,
    feesPaid,
    slippagePaid,
    netPnl,
    realizedNetApy,
  };
}
