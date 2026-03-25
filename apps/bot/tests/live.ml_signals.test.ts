import { mkdirSync, writeFileSync, unlinkSync } from "fs";
import path from "path";
import { loadMlSignalsFromFile } from "../src/live";

describe("live ml signal loader", () => {
  it("loads edge and regime signals from payload file", () => {
    const outputDir = path.join(process.cwd(), "..", "..", "ml", "output");
    mkdirSync(outputDir, { recursive: true });
    const filePath = path.join(outputDir, "test_ml_payload.json");
    writeFileSync(filePath, JSON.stringify({
      edge_predictions: [
        { market: "BTC-PERP", expected_net_apy: 0.12, confidence: 0.8 },
      ],
      regime_prediction: {
        stable_carry_probability: 0.6,
        unstable_carry_probability: 0.3,
        risk_off_probability: 0.1,
      },
    }), "utf-8");

    const result = loadMlSignalsFromFile(filePath);
    expect(result.edgeSignals[0].market).toBe("BTC-PERP");
    expect(result.regimeSignal.stableCarryProbability).toBe(0.6);

    unlinkSync(filePath);
  });
});
