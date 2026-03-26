import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { BotState } from "../types";
import { resolveWorkspacePath } from "./workspace_paths";

const STORAGE_PATH = resolveWorkspacePath("ml/output/bot_state.json");

const EMPTY_STATE: BotState = {
  isAutomationEnabled: false,
  lastCycleAt: null,
  pnlSol: 0,
  pnlUsd: 0,
  totalDepositsSol: 0,
  totalClaimsSol: 0,
  claimableByWallet: {},
  userDepositAddressByWallet: {},
  depositLedger: [],
  claimLedger: [],
};

function ensureDir(): void {
  mkdirSync(path.dirname(STORAGE_PATH), { recursive: true });
}

export function loadState(): BotState {
  if (!existsSync(STORAGE_PATH)) {
    return { ...EMPTY_STATE };
  }
  const payload = JSON.parse(readFileSync(STORAGE_PATH, "utf-8")) as BotState;
  return {
    ...EMPTY_STATE,
    ...payload,
  };
}

export function saveState(state: BotState): void {
  ensureDir();
  writeFileSync(STORAGE_PATH, JSON.stringify(state, null, 2), "utf-8");
}
