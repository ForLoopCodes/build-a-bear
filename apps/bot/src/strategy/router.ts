import {
  EdgeSignal,
  RegimeSignal,
  RiskDecision,
  StrategyState,
} from "@build-a-bear/core";
import { BotConfig } from "../config";

function selectDominantRegime(regime: RegimeSignal): "stable" | "unstable" | "riskOff" {
  const pairs: Array<["stable" | "unstable" | "riskOff", number]> = [
    ["stable", regime.stableCarryProbability],
    ["unstable", regime.unstableCarryProbability],
    ["riskOff", regime.riskOffProbability],
  ];
  pairs.sort((a, b) => b[1] - a[1]);
  return pairs[0][0];
}

export function chooseStrategyState(
  edgeSignals: EdgeSignal[],
  regimeSignal: RegimeSignal,
  riskDecision: RiskDecision,
  config: BotConfig,
): { state: StrategyState; reasons: string[] } {
  const reasons: string[] = [];
  const dominantRegime = selectDominantRegime(regimeSignal);
  const topEdge = edgeSignals
    .slice()
    .sort((a, b) => b.expectedNetApy - a.expectedNetApy)[0];

  if (riskDecision.forceSafetyState || !riskDecision.isTradingAllowed) {
    reasons.push("Risk engine forced safety state");
    return { state: StrategyState.Safety, reasons };
  }

  if (!topEdge) {
    reasons.push("No edge signals available");
    return { state: StrategyState.Safety, reasons };
  }

  if (dominantRegime === "riskOff") {
    reasons.push("Regime classifier indicates risk-off");
    return { state: StrategyState.Safety, reasons };
  }

  if (topEdge.expectedNetApy < config.exitNetApy) {
    reasons.push("Top edge below exit threshold");
    return { state: StrategyState.Safety, reasons };
  }

  if (dominantRegime === "stable" && topEdge.expectedNetApy >= config.minEntryNetApy) {
    reasons.push("Stable carry regime with edge above entry threshold");
    return { state: StrategyState.Carry, reasons };
  }

  if (dominantRegime === "unstable" && topEdge.expectedNetApy >= config.minEntryNetApy * 1.25) {
    reasons.push("Unstable regime but spread edge strong enough for spread state");
    return { state: StrategyState.Spread, reasons };
  }

  reasons.push("Conservative fallback to safety state");
  return { state: StrategyState.Safety, reasons };
}

export function shouldRebalance(
  previousState: StrategyState,
  nextState: StrategyState,
  topEdge: number,
  config: BotConfig,
): boolean {
  if (previousState !== nextState) {
    return true;
  }
  if (nextState === StrategyState.Safety) {
    return false;
  }
  return topEdge >= config.exitNetApy;
}
