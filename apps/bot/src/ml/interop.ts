import { EdgeSignal, RegimeSignal } from "@build-a-bear/core";

export type MlPredictionPayload = {
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

export function parseMlPredictionPayload(payload: MlPredictionPayload): {
  edges: EdgeSignal[];
  regime: RegimeSignal;
} {
  const edges: EdgeSignal[] = payload.edge_predictions.map((prediction) => ({
    market: prediction.market,
    expectedNetApy: prediction.expected_net_apy,
    confidence: prediction.confidence,
  }));

  const regime: RegimeSignal = {
    stableCarryProbability: payload.regime_prediction.stable_carry_probability,
    unstableCarryProbability: payload.regime_prediction.unstable_carry_probability,
    riskOffProbability: payload.regime_prediction.risk_off_probability,
  };

  return { edges, regime };
}
