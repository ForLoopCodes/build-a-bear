import { loadBotConfig } from "../src/config";

const ORIGINAL_ENV = process.env;

const REQUIRED_BASE_ENV = {
  RPC_URL: "https://rpc.mainnet.example",
  RPC_FALLBACK_URL: "https://rpc.fallback.example",
};

function setEnv(vars: Record<string, string | undefined>): void {
  process.env = { ...ORIGINAL_ENV, ...REQUIRED_BASE_ENV };
  Object.entries(vars).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key];
      return;
    }
    process.env[key] = value;
  });
}

describe("bot config loader", () => {
  beforeEach(() => {
    setEnv({
      REBALANCE_INTERVAL_MS: undefined,
      SIGNAL_INTERVAL_MS: undefined,
      HEALTH_INTERVAL_MS: undefined,
      REPORTING_INTERVAL_MS: undefined,
      MIN_ENTRY_NET_APY: undefined,
      EXIT_NET_APY: undefined,
      MAX_GROSS_EXPOSURE_MULTIPLIER: undefined,
      MAX_MARKET_WEIGHT: undefined,
      HEALTH_SOFT_LIMIT: undefined,
      HEALTH_HARD_LIMIT: undefined,
      DAILY_SOFT_DRAWDOWN_PCT: undefined,
      DAILY_HARD_DRAWDOWN_PCT: undefined,
      ROLLING_HARD_DRAWDOWN_PCT: undefined,
      DRY_RUN: undefined,
    });
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("loads defaults when optional vars are absent", () => {
    const config = loadBotConfig();
    expect(config.rpcUrl).toBe("https://rpc.mainnet.example");
    expect(config.rebalanceIntervalMs).toBe(4 * 60 * 60 * 1000);
    expect(config.minEntryNetApy).toBe(0.12);
    expect(config.exitNetApy).toBe(0.08);
    expect(config.dryRun).toBe(true);
  });

  it("parses explicit overrides", () => {
    setEnv({
      RPC_URL: "https://rpc.override.example",
      MIN_ENTRY_NET_APY: "0.2",
      EXIT_NET_APY: "0.1",
      MAX_MARKET_WEIGHT: "0.2",
      DRY_RUN: "false",
    });

    const config = loadBotConfig();
    expect(config.rpcUrl).toBe("https://rpc.override.example");
    expect(config.minEntryNetApy).toBe(0.2);
    expect(config.exitNetApy).toBe(0.1);
    expect(config.maxMarketWeight).toBe(0.2);
    expect(config.dryRun).toBe(false);
  });

  it("throws for missing required RPC_URL", () => {
    setEnv({ RPC_URL: undefined });
    expect(() => loadBotConfig()).toThrow("Missing required environment variable: RPC_URL");
  });

  it("throws for invalid numeric values", () => {
    setEnv({ MIN_ENTRY_NET_APY: "abc" });
    expect(() => loadBotConfig()).toThrow("Invalid numeric environment variable: MIN_ENTRY_NET_APY");
  });

  it("throws when exit threshold exceeds entry threshold", () => {
    setEnv({ MIN_ENTRY_NET_APY: "0.1", EXIT_NET_APY: "0.2" });
    expect(() => loadBotConfig()).toThrow("EXIT_NET_APY cannot exceed MIN_ENTRY_NET_APY");
  });

  it("throws for invalid boolean values", () => {
    setEnv({ DRY_RUN: "maybe" });
    expect(() => loadBotConfig()).toThrow("Invalid boolean environment variable: DRY_RUN");
  });

  it("throws for invalid risk hierarchy", () => {
    setEnv({ HEALTH_SOFT_LIMIT: "45", HEALTH_HARD_LIMIT: "50" });
    expect(() => loadBotConfig()).toThrow("HEALTH_HARD_LIMIT cannot exceed HEALTH_SOFT_LIMIT");
  });
});
