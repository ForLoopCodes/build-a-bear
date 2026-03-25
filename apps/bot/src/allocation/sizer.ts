import {
  AllocationTarget,
  EdgeSignal,
  RiskDecision,
  StrategyState,
} from "@build-a-bear/core";
import { BotConfig } from "../config";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeWeights(weights: AllocationTarget[]): AllocationTarget[] {
  const total = weights.reduce((sum, item) => sum + item.targetWeight, 0);
  if (total <= 0) {
    return weights;
  }
  return weights.map((item) => ({
    ...item,
    targetWeight: item.targetWeight / total,
  }));
}

export function buildAllocations(
  state: StrategyState,
  edgeSignals: EdgeSignal[],
  riskDecision: RiskDecision,
  config: BotConfig,
): AllocationTarget[] {
  if (state === StrategyState.Safety || !riskDecision.isTradingAllowed) {
    return edgeSignals.map((signal) => ({
      market: signal.market,
      targetWeight: 0,
    }));
  }

  const sorted = edgeSignals
    .slice()
    .sort((a, b) => b.expectedNetApy * b.confidence - a.expectedNetApy * a.confidence);

  const capped = sorted.map((signal) => {
    const edgeScore = Math.max(0, signal.expectedNetApy - config.exitNetApy) * signal.confidence;
    return {
      market: signal.market,
      targetWeight: clamp(edgeScore, 0, config.maxMarketWeight),
    };
  });

  const normalized = normalizeWeights(capped);
  const grossLimitFactor = clamp(
    riskDecision.maxGrossExposureMultiplier / Math.max(config.maxGrossExposureMultiplier, 1e-9),
    0,
    1,
  );

  return normalized.map((item) => ({
    ...item,
    targetWeight: clamp(item.targetWeight * grossLimitFactor, 0, config.maxMarketWeight),
  }));
}
