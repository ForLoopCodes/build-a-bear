import { EdgeSignal, RegimeSignal } from "@build-a-bear/core";
import { readFileSync } from "fs";

export type MlSignalPayload = {
  edge_predictions: Array<{
    market: string;
    expected_net_apy: number;
    confidence: number;
  }>;
  regime_prediction: {
    stable_carry_probability: number;
    unstable_carry_probability: number;
    risk_off_probability: number;
  };
};

export function loadMlSignalsFromFile(path: string): { edgeSignals: EdgeSignal[]; regimeSignal: RegimeSignal } {
  const raw = readFileSync(path, "utf-8");
  const payload = JSON.parse(raw) as MlSignalPayload;
  return {
    edgeSignals: payload.edge_predictions.map((item) => ({
      market: item.market,
      expectedNetApy: item.expected_net_apy,
      confidence: item.confidence,
    })),
    regimeSignal: {
      stableCarryProbability: payload.regime_prediction.stable_carry_probability,
      unstableCarryProbability: payload.regime_prediction.unstable_carry_probability,
      riskOffProbability: payload.regime_prediction.risk_off_probability,
    },
  };
}
