import dotenv from "dotenv";
import { StrategyConfig, DEFAULT_RISK_PARAMS, DRIFT_MARKETS, FeeConfig } from "./types.js";

dotenv.config();

export const config: StrategyConfig = {
  name: "DriftPack Funding Optimizer",
  risk: DEFAULT_RISK_PARAMS,
  markets: DRIFT_MARKETS,
  fee: {
    managementFeeBps: 200,
    performanceFeeBps: 2000,
    minDepositBps: 100,
  },
};

export const RANGER_API_URL = "https://api.voltr.xyz";
export const DRIFT_DATA_API = "https://data.api.drift.trade";
export const SOLANA_RPC = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
export const ENVIRONMENT = process.env.ENV || "mainnet";

export const FUNDING_RATE_PRECISION = 1e6;
export const QUOTE_PRECISION = 1e6;
export const BASE_PRECISION = 1e9;
export const HOUR_SECONDS = 3600;
export const DAY_SECONDS = 86400;
export const YEAR_SECONDS = 31536000;

export const REBALANCE_INTERVAL_MS = 60_000;
export const FUNDING_CHECK_INTERVAL_MS = 30_000;
export const HEALTH_CHECK_INTERVAL_MS = 15_000;
