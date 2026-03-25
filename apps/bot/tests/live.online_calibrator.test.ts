import { existsSync, mkdirSync, unlinkSync } from "fs";
import path from "path";
import { OnlineCalibrator } from "../src/live";

describe("online calibrator", () => {
  it("updates and persists calibration state", () => {
    const outputDir = path.join(process.cwd(), "..", "..", "ml", "output");
    mkdirSync(outputDir, { recursive: true });
    const statePath = path.join(outputDir, "test_calibrator.json");
    const calibrator = new OnlineCalibrator();

    const calibrated = calibrator.calibrate([
      { market: "BTC-PERP", expectedNetApy: 0.12, confidence: 0.8 },
    ]);

    expect(calibrated[0].expectedNetApy).toBeGreaterThan(0);

    calibrator.update(1);
    calibrator.save(statePath);
    expect(existsSync(statePath)).toBe(true);

    const loaded = OnlineCalibrator.load(statePath);
    expect(loaded.snapshot().count).toBe(1);

    unlinkSync(statePath);
  });
});
