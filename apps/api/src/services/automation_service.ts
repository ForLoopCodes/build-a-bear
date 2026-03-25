import { execSync } from "child_process";
import path from "path";
import { readFileSync } from "fs";
import { RunCycleResult } from "../types";

export function runPaperCycleAndReadResult(triggerRunner: boolean): RunCycleResult {
  if (triggerRunner) {
    execSync("npm run bot:devnet:paper", {
      cwd: process.cwd(),
      stdio: "pipe",
    });
  }

  const filePath = path.join(process.cwd(), "ml", "output", "devnet_paper_run.json");
  const payload = JSON.parse(readFileSync(filePath, "utf-8"));

  return {
    strategyState: payload.strategyState,
    netPnlSol: Number(payload.simulation?.netPnl ?? 0),
    netPnlUsd: Number(payload.simulation?.netPnl ?? 0) * Number(payload.solReferencePrice ?? 0),
    timestamp: payload.timestamp,
  };
}

export function runTrainingAndReadSummary(): {
  summaryPath: string;
  edgeRmse: number;
  rlBestReward: number;
} {
  execSync("npm run ml:production", {
    cwd: process.cwd(),
    stdio: "pipe",
  });

  const summaryPath = path.join(process.cwd(), "ml", "output", "training_summary.json");
  const summary = JSON.parse(readFileSync(summaryPath, "utf-8"));
  return {
    summaryPath,
    edgeRmse: Number(summary.edge_metrics?.rmse ?? 0),
    rlBestReward: Number(summary.rl_metrics?.best_reward ?? 0),
  };
}
