import { execSync } from "child_process";
import { readFileSync } from "fs";
import { RunCycleResult } from "../types";
import { resolveWorkspacePath, workspaceRoot } from "./workspace_paths";

export function runPaperCycleAndReadResult(triggerRunner: boolean): RunCycleResult {
  if (triggerRunner) {
    execSync("npm run bot:devnet:paper", {
      cwd: workspaceRoot,
      stdio: "pipe",
    });
  }

  const filePath = resolveWorkspacePath("ml/output/devnet_paper_run.json");
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
    cwd: workspaceRoot,
    stdio: "pipe",
  });

  const summaryPath = resolveWorkspacePath("ml/output/training_summary.json");
  const summary = JSON.parse(readFileSync(summaryPath, "utf-8"));
  return {
    summaryPath,
    edgeRmse: Number(summary.edge_metrics?.rmse ?? 0),
    rlBestReward: Number(summary.rl_metrics?.best_reward ?? 0),
  };
}
