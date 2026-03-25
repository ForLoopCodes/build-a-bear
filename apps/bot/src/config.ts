import dotenv from "dotenv";

dotenv.config();

export type BotConfig = {
  rpcUrl: string;
  fallbackRpcUrl: string | null;
  rebalanceIntervalMs: number;
  signalIntervalMs: number;
  healthIntervalMs: number;
  reportingIntervalMs: number;
  minEntryNetApy: number;
  exitNetApy: number;
  maxGrossExposureMultiplier: number;
  maxMarketWeight: number;
  healthSoftLimit: number;
  healthHardLimit: number;
  dailySoftDrawdownPct: number;
  dailyHardDrawdownPct: number;
  rollingHardDrawdownPct: number;
  dryRun: boolean;
};

const DEFAULTS = {
  rebalanceIntervalMs: 4 * 60 * 60 * 1000,
  signalIntervalMs: 60 * 60 * 1000,
  healthIntervalMs: 30 * 1000,
  reportingIntervalMs: 24 * 60 * 60 * 1000,
  minEntryNetApy: 0.12,
  exitNetApy: 0.08,
  maxGrossExposureMultiplier: 2.2,
  maxMarketWeight: 0.25,
  healthSoftLimit: 55,
  healthHardLimit: 45,
  dailySoftDrawdownPct: -0.05,
  dailyHardDrawdownPct: -0.08,
  rollingHardDrawdownPct: -0.12,
  dryRun: true,
} as const;

function getEnv(name: string): string | undefined {
  const value = process.env[name];
  if (value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function parseRequired(name: string): string {
  const value = getEnv(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseOptional(name: string): string | null {
  return getEnv(name) ?? null;
}

function parseNumber(name: string, fallback: number): number {
  const value = getEnv(name);
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric environment variable: ${name}`);
  }
  return parsed;
}

function parseBoolean(name: string, fallback: boolean): boolean {
  const value = getEnv(name);
  if (!value) {
    return fallback;
  }
  if (value === "true" || value === "1") {
    return true;
  }
  if (value === "false" || value === "0") {
    return false;
  }
  throw new Error(`Invalid boolean environment variable: ${name}`);
}

function assertRange(name: string, value: number, min: number, max: number): void {
  if (value < min || value > max) {
    throw new Error(`Configuration ${name} out of range: ${value}`);
  }
}

export function loadBotConfig(): BotConfig {
  const config: BotConfig = {
    rpcUrl: parseRequired("RPC_URL"),
    fallbackRpcUrl: parseOptional("RPC_FALLBACK_URL"),
    rebalanceIntervalMs: parseNumber("REBALANCE_INTERVAL_MS", DEFAULTS.rebalanceIntervalMs),
    signalIntervalMs: parseNumber("SIGNAL_INTERVAL_MS", DEFAULTS.signalIntervalMs),
    healthIntervalMs: parseNumber("HEALTH_INTERVAL_MS", DEFAULTS.healthIntervalMs),
    reportingIntervalMs: parseNumber("REPORTING_INTERVAL_MS", DEFAULTS.reportingIntervalMs),
    minEntryNetApy: parseNumber("MIN_ENTRY_NET_APY", DEFAULTS.minEntryNetApy),
    exitNetApy: parseNumber("EXIT_NET_APY", DEFAULTS.exitNetApy),
    maxGrossExposureMultiplier: parseNumber(
      "MAX_GROSS_EXPOSURE_MULTIPLIER",
      DEFAULTS.maxGrossExposureMultiplier,
    ),
    maxMarketWeight: parseNumber("MAX_MARKET_WEIGHT", DEFAULTS.maxMarketWeight),
    healthSoftLimit: parseNumber("HEALTH_SOFT_LIMIT", DEFAULTS.healthSoftLimit),
    healthHardLimit: parseNumber("HEALTH_HARD_LIMIT", DEFAULTS.healthHardLimit),
    dailySoftDrawdownPct: parseNumber("DAILY_SOFT_DRAWDOWN_PCT", DEFAULTS.dailySoftDrawdownPct),
    dailyHardDrawdownPct: parseNumber("DAILY_HARD_DRAWDOWN_PCT", DEFAULTS.dailyHardDrawdownPct),
    rollingHardDrawdownPct: parseNumber(
      "ROLLING_HARD_DRAWDOWN_PCT",
      DEFAULTS.rollingHardDrawdownPct,
    ),
    dryRun: parseBoolean("DRY_RUN", DEFAULTS.dryRun),
  };

  assertRange("minEntryNetApy", config.minEntryNetApy, 0, 2);
  assertRange("exitNetApy", config.exitNetApy, 0, 2);
  if (config.exitNetApy > config.minEntryNetApy) {
    throw new Error("EXIT_NET_APY cannot exceed MIN_ENTRY_NET_APY");
  }

  assertRange("maxGrossExposureMultiplier", config.maxGrossExposureMultiplier, 0, 5);
  assertRange("maxMarketWeight", config.maxMarketWeight, 0, 1);
  assertRange("healthSoftLimit", config.healthSoftLimit, 0, 100);
  assertRange("healthHardLimit", config.healthHardLimit, 0, 100);

  if (config.healthHardLimit > config.healthSoftLimit) {
    throw new Error("HEALTH_HARD_LIMIT cannot exceed HEALTH_SOFT_LIMIT");
  }

  assertRange("dailySoftDrawdownPct", config.dailySoftDrawdownPct, -1, 0);
  assertRange("dailyHardDrawdownPct", config.dailyHardDrawdownPct, -1, 0);
  assertRange("rollingHardDrawdownPct", config.rollingHardDrawdownPct, -1, 0);

  if (config.dailyHardDrawdownPct > config.dailySoftDrawdownPct) {
    throw new Error("DAILY_HARD_DRAWDOWN_PCT must be less or equal to DAILY_SOFT_DRAWDOWN_PCT");
  }

  if (config.rollingHardDrawdownPct > config.dailyHardDrawdownPct) {
    throw new Error("ROLLING_HARD_DRAWDOWN_PCT must be less or equal to DAILY_HARD_DRAWDOWN_PCT");
  }

  return config;
}
