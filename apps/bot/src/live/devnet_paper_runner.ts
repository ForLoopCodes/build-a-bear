import { StrategyState, allocationTargetSchema } from "@build-a-bear/core";
import { appendFileSync, writeFileSync } from "fs";
import path from "path";
import { clusterApiUrl } from "@solana/web3.js";
import { buildAllocations } from "../allocation";
import { loadBotConfig } from "../config";
import { simulateExecution } from "../execution";
import { evaluateRiskPolicy } from "../risk";
import { chooseStrategyState } from "../strategy";
import { fetchLiveMarketSnapshots } from "./binance_live_source";
import { createDevnetWalletContext, fetchDevnetSolBalance } from "./devnet_wallet";
import { loadMlSignalsFromFile } from "./ml_signals";
import { OnlineCalibrator } from "./online_calibrator";

type RunOptions = {
  keypairPath: string;
  mlPayloadPath: string;
  calibratorPath: string;
  outputPath: string;
  historyPath: string;
  markets: string[];
};

export async function runDevnetPaperTradingCycle(options: RunOptions): Promise<void> {
  if (!process.env.RPC_URL) {
    process.env.RPC_URL = clusterApiUrl("devnet");
  }

  const config = loadBotConfig();
  const wallet = createDevnetWalletContext(options.keypairPath);
  const solBalance = await fetchDevnetSolBalance(wallet);

  const liveSnapshots = await fetchLiveMarketSnapshots(options.markets);
  const avgVolatility = liveSnapshots.reduce((sum, item) => sum + item.volatility24h, 0) /
    Math.max(liveSnapshots.length, 1);
  const avgDivergence = liveSnapshots.reduce((sum, item) => sum + item.markOracleDivergenceBps, 0) /
    Math.max(liveSnapshots.length, 1);

  const riskSnapshot = {
    accountHealth: 75,
    drawdownDailyPct: -0.01,
    drawdownRollingPct: -0.03,
    liquidationDistancePct: 20,
    telemetryHealthy: true,
  };

  const riskDecision = evaluateRiskPolicy(riskSnapshot, config);
  const mlSignals = loadMlSignalsFromFile(options.mlPayloadPath);
  const calibrator = OnlineCalibrator.load(options.calibratorPath);
  const calibratedEdges = calibrator.calibrate(mlSignals.edgeSignals);

  const regimeSignal = {
    stableCarryProbability: Math.max(0.05, mlSignals.regimeSignal.stableCarryProbability - avgVolatility),
    unstableCarryProbability: Math.min(0.85, mlSignals.regimeSignal.unstableCarryProbability + avgVolatility * 0.5),
    riskOffProbability: Math.min(0.9, mlSignals.regimeSignal.riskOffProbability + avgDivergence / 300),
  };

  const stateDecision = chooseStrategyState(calibratedEdges, regimeSignal, riskDecision, config);
  const allocations = buildAllocations(stateDecision.state, calibratedEdges, riskDecision, config)
    .map((allocation) => allocationTargetSchema.parse(allocation));

  const simulation = simulateExecution(
    allocations.map((allocation) => ({
      market: allocation.market,
      fromWeight: 0,
      toWeight: allocation.targetWeight,
      deltaWeight: allocation.targetWeight,
    })),
    {
      portfolioValue: Math.max(
        1_000,
        solBalance * (
          liveSnapshots.find((item) => item.market === "SOL-PERP")?.referencePrice ??
          liveSnapshots[0]?.referencePrice ??
          150
        ),
      ),
      feeRateBps: 2,
      slippageRateBps: 3,
      fundingContributionApy: calibratedEdges.reduce((sum, item) => sum + item.expectedNetApy, 0) /
        Math.max(1, calibratedEdges.length),
      basisContributionApy: 0.02,
      lendContributionApy: 0.05,
    },
  );

  calibrator.update(simulation.netPnl);
  calibrator.save(options.calibratorPath);

  const output = {
    timestamp: new Date().toISOString(),
    wallet: wallet.publicKey.toBase58(),
    solBalance,
    solReferencePrice: liveSnapshots.find((item) => item.market === "SOL-PERP")?.referencePrice ?? null,
    markets: options.markets,
    strategyState: stateDecision.state,
    riskDecision,
    regimeSignal,
    calibratedEdges,
    allocations,
    simulation,
    realtimeLearned: calibrator.snapshot(),
    note: "devnet-paper-trading-only-no-on-chain-order-execution",
  };

  writeFileSync(options.outputPath, JSON.stringify(output, null, 2), "utf-8");
  appendFileSync(options.historyPath, `${JSON.stringify(output)}\n`, "utf-8");
}

export async function runDefaultDevnetPaperTradingCycle(): Promise<void> {
  const keypairPath = process.env.DEVNET_KEYPAIR_PATH;
  if (!keypairPath) {
    throw new Error("DEVNET_KEYPAIR_PATH is required");
  }

  const root = path.resolve(process.cwd(), "..", "..");
  await runDevnetPaperTradingCycle({
    keypairPath,
    mlPayloadPath: process.env.ML_PAYLOAD_PATH ?? path.join(root, "ml", "output", "inference_payload.json"),
    calibratorPath: process.env.CALIBRATOR_PATH ?? path.join(root, "ml", "output", "online_calibrator.json"),
    outputPath: process.env.PAPER_OUTPUT_PATH ?? path.join(root, "ml", "output", "devnet_paper_run.json"),
    historyPath: process.env.PAPER_HISTORY_PATH ?? path.join(root, "ml", "output", "paper_trade_history.jsonl"),
    markets: (process.env.PAPER_MARKETS ?? "BTC-PERP,ETH-PERP,SOL-PERP").split(",").map((item) => item.trim()).filter(Boolean),
  });
}

if (require.main === module) {
  runDefaultDevnetPaperTradingCycle()
    .then(() => {
      process.stdout.write("devnet_paper_cycle_complete\n");
    })
    .catch((error: unknown) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exit(1);
    });
}
