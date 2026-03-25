import { mkdirSync, writeFileSync, unlinkSync } from "fs";
import path from "path";
import { Keypair } from "@solana/web3.js";
import { runDevnetPaperTradingCycle } from "../src/live";

jest.mock("../src/live/devnet_wallet", () => {
  const original = jest.requireActual("../src/live/devnet_wallet");
  return {
    ...original,
    fetchDevnetSolBalance: jest.fn().mockResolvedValue(12.5),
  };
});

jest.mock("../src/live/binance_live_source", () => {
  const original = jest.requireActual("../src/live/binance_live_source");
  return {
    ...original,
    fetchLiveMarketSnapshots: jest.fn().mockResolvedValue([
      {
        timestamp: new Date().toISOString(),
        market: "BTC-PERP",
        fundingRateHourly: 0.0001,
        basisBps: 12,
        markOracleDivergenceBps: 5,
        bidAskSpreadBps: 3,
        volume1h: 1_000_000,
        openInterest: 7_000_000,
        volatility1h: 0.01,
        volatility24h: 0.04,
        lendApy: 0.08,
        borrowApy: 0.1,
        utilization: 0.7,
        estimatedExecutionCostBps: 5,
        referencePrice: 170,
      },
      {
        timestamp: new Date().toISOString(),
        market: "SOL-PERP",
        fundingRateHourly: 0.00015,
        basisBps: 16,
        markOracleDivergenceBps: 7,
        bidAskSpreadBps: 4,
        volume1h: 1_500_000,
        openInterest: 6_000_000,
        volatility1h: 0.012,
        volatility24h: 0.05,
        lendApy: 0.08,
        borrowApy: 0.11,
        utilization: 0.72,
        estimatedExecutionCostBps: 6,
        referencePrice: 165,
      },
    ]),
  };
});

describe("devnet paper runner", () => {
  it("produces devnet paper output artifact", async () => {
    process.env.RPC_URL = "https://api.devnet.solana.com";

    const keypair = Keypair.generate();
    const outputDir = path.join(process.cwd(), "..", "..", "ml", "output");
    mkdirSync(outputDir, { recursive: true });

    const keypairPath = path.join(outputDir, "test_runner_keypair.json");
    const mlPayloadPath = path.join(outputDir, "test_runner_ml_payload.json");
    const calibratorPath = path.join(outputDir, "test_runner_calibrator.json");
    const outputPath = path.join(outputDir, "test_runner_output.json");
    const historyPath = path.join(outputDir, "test_runner_history.jsonl");

    writeFileSync(keypairPath, JSON.stringify(Array.from(keypair.secretKey)), "utf-8");
    writeFileSync(mlPayloadPath, JSON.stringify({
      edge_predictions: [
        { market: "BTC-PERP", expected_net_apy: 0.13, confidence: 0.8 },
        { market: "SOL-PERP", expected_net_apy: 0.15, confidence: 0.78 },
      ],
      regime_prediction: {
        stable_carry_probability: 0.6,
        unstable_carry_probability: 0.25,
        risk_off_probability: 0.15,
      },
    }), "utf-8");

    await runDevnetPaperTradingCycle({
      keypairPath,
      mlPayloadPath,
      calibratorPath,
      outputPath,
      historyPath,
      markets: ["BTC-PERP", "SOL-PERP"],
    });

    const output = JSON.parse(require("fs").readFileSync(outputPath, "utf-8"));
    expect(output.strategyState).toBeDefined();
    expect(output.simulation.netPnl).toBeDefined();

    unlinkSync(keypairPath);
    unlinkSync(mlPayloadPath);
    unlinkSync(calibratorPath);
    unlinkSync(outputPath);
    unlinkSync(historyPath);
  });
});
