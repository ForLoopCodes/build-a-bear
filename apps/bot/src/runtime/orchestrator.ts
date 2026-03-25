import { EdgeSignal, StrategyState } from "@build-a-bear/core";
import { DriftDataSource } from "../adapters";
import { buildAllocations } from "../allocation";
import { BotConfig } from "../config";
import { simulateExecution } from "../execution";
import { buildFeatureVectors } from "../features";
import { planRebalanceActions } from "../rebalance";
import { buildKpiReport } from "../reporting";
import { evaluateRiskPolicy } from "../risk";
import { chooseStrategyState, shouldRebalance } from "../strategy";

export type RuntimeInput = {
  markets: string[];
  previousState: StrategyState;
  currentAllocations: { market: string; targetWeight: number }[];
};

export type RuntimeOutput = {
  nextState: StrategyState;
  actions: ReturnType<typeof planRebalanceActions>;
  reportText: string;
};

function makeEdgeSignals(featureVectors: ReturnType<typeof buildFeatureVectors>): EdgeSignal[] {
  return featureVectors.map((vector) => ({
    market: vector.market,
    expectedNetApy: Math.max(0, vector.carryEdgeApy - vector.estimatedExecutionCostBps / 10_000),
    confidence: Math.max(0.1, Math.min(0.95, 1 - vector.markOracleDivergenceBps / 100)),
  }));
}

function makeRegimeSignal(featureVectors: ReturnType<typeof buildFeatureVectors>) {
  const avgVol = featureVectors.reduce((sum, item) => sum + item.volatility24h, 0) /
    Math.max(featureVectors.length, 1);
  const avgDivergence = featureVectors.reduce(
    (sum, item) => sum + item.markOracleDivergenceBps,
    0,
  ) / Math.max(featureVectors.length, 1);

  if (avgVol > 0.08 || avgDivergence > 30) {
    return { stableCarryProbability: 0.15, unstableCarryProbability: 0.2, riskOffProbability: 0.65 };
  }

  if (avgVol > 0.05) {
    return { stableCarryProbability: 0.25, unstableCarryProbability: 0.6, riskOffProbability: 0.15 };
  }

  return { stableCarryProbability: 0.7, unstableCarryProbability: 0.2, riskOffProbability: 0.1 };
}

export async function runSingleCycle(
  input: RuntimeInput,
  config: BotConfig,
): Promise<RuntimeOutput> {
  const source = new DriftDataSource();
  const timestamp = new Date().toISOString();

  const snapshots = await source.fetchMarketSnapshots(input.markets, timestamp);
  const riskSnapshot = await source.fetchRiskSnapshot();
  const featureVectors = buildFeatureVectors(snapshots, []);
  const edgeSignals = makeEdgeSignals(featureVectors);
  const regimeSignal = makeRegimeSignal(featureVectors);
  const riskDecision = evaluateRiskPolicy(riskSnapshot, config);

  const { state: nextState } = chooseStrategyState(edgeSignals, regimeSignal, riskDecision, config);
  const targets = buildAllocations(nextState, edgeSignals, riskDecision, config);

  const topEdge = edgeSignals.length
    ? edgeSignals.slice().sort((a, b) => b.expectedNetApy - a.expectedNetApy)[0].expectedNetApy
    : 0;

  const actions = shouldRebalance(input.previousState, nextState, topEdge, config)
    ? planRebalanceActions(input.currentAllocations, targets, 0.01)
    : [];

  const simulation = simulateExecution(actions, {
    portfolioValue: 100_000,
    feeRateBps: 2,
    slippageRateBps: 3,
    fundingContributionApy: edgeSignals.reduce((sum, item) => sum + item.expectedNetApy, 0) /
      Math.max(edgeSignals.length, 1),
    basisContributionApy: 0.02,
    lendContributionApy: 0.05,
  });

  const report = buildKpiReport({
    date: timestamp.split("T")[0],
    state: nextState,
    summary: simulation,
    fundingContribution: 0.08,
    basisContribution: 0.02,
    lendContribution: 0.05,
    maxIntradayDrawdownPct: riskSnapshot.drawdownDailyPct,
    accountHealth: riskSnapshot.accountHealth,
    notes: riskDecision.reasons,
  });

  return {
    nextState,
    actions,
    reportText: JSON.stringify(report),
  };
}
