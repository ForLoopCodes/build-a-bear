import { parseMlPredictionPayload } from "../src/ml";

describe("ml interop", () => {
  it("maps python-style payloads to bot domain types", () => {
    const parsed = parseMlPredictionPayload({
      edge_predictions: [
        { market: "BTC-PERP", expected_net_apy: 0.14, confidence: 0.81 },
        { market: "ETH-PERP", expected_net_apy: 0.12, confidence: 0.74 },
      ],
      regime_prediction: {
        stable_carry_probability: 0.62,
        unstable_carry_probability: 0.25,
        risk_off_probability: 0.13,
      },
    });

    expect(parsed.edges).toHaveLength(2);
    expect(parsed.edges[0].expectedNetApy).toBe(0.14);
    expect(parsed.regime.stableCarryProbability).toBe(0.62);
  });
});
