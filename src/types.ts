import type { BN } from "bn.js";
import type { PublicKey } from "@solana/web3.js";

export interface MarketFunding {
  marketIndex: number;
  symbol: string;
  fundingRateHourly: BN;
  fundingRateAnnualized: number;
  openInterest: BN;
  openInterestLong: BN;
  openInterestShort: BN;
  lastUpdate: number;
  oraclePrice: BN;
  marketDepth: number;
}

export interface Position {
  marketIndex: number;
  symbol: string;
  direction: "long" | "short";
  size: BN;
  entryPrice: BN;
  currentPrice: BN;
  unrealizedPnl: BN;
  fundingAccrued: BN;
  timestamp: number;
}

export interface Allocation {
  marketIndex: number;
  symbol: string;
  targetPercent: number;
  currentPercent: number;
  direction: "long" | "short";
  estimatedApy: number;
  score: number;
}

export interface RiskParams {
  maxLeveragePerMarket: number;
  maxTotalLeverage: number;
  maxPositionPercent: number;
  drawdownCircuitBreaker: number;
  rebalanceThreshold: number;
  stopLossPercent: number;
  minFundingRateHourly: string;
  cooldownSeconds: number;
}

export interface VaultState {
  totalValue: string;
  deployedValue: string;
  idleValue: string;
  totalPnl: string;
  dailyPnl: string;
  currentDrawdown: number;
  maxDrawdown: number;
  lastRebalance: number;
  isPaused: boolean;
  positions: Position[];
  allocations: Allocation[];
}

export interface StrategyConfig {
  name: string;
  risk: RiskParams;
  markets: MarketConfig[];
  fee: FeeConfig;
}

export interface MarketConfig {
  marketIndex: number;
  symbol: string;
  enabled: boolean;
  maxAllocation: number;
  driftMarketIndex: number;
}

export interface FeeConfig {
  managementFeeBps: number;
  performanceFeeBps: number;
  minDepositBps: number;
}

export interface DriftMarketData {
  perpMarketAccount: {
    marketIndex: number;
    amm: {
      baseAssetReserve: string;
      quoteAssetReserve: string;
      lastUpdateSlot: string;
      lastFundingRate: string;
    };
    record: {
      fundingRate: string;
      openInterest: string;
      openInterestLong: string;
      openInterestShort: string;
    };
  };
}

export interface FundingRateSnapshot {
  marketIndex: number;
  rate: string;
  timestamp: number;
  direction: "positive" | "negative";
}

export interface BacktestResult {
  period: string;
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  avgFundingCollected: number;
  tradesExecuted: number;
  winRate: number;
}

export const DRIFT_MARKETS: MarketConfig[] = [
  { marketIndex: 0, symbol: "SOL", enabled: true, maxAllocation: 0.25, driftMarketIndex: 0 },
  { marketIndex: 1, symbol: "BTC", enabled: true, maxAllocation: 0.20, driftMarketIndex: 1 },
  { marketIndex: 2, symbol: "ETH", enabled: true, maxAllocation: 0.20, driftMarketIndex: 2 },
  { marketIndex: 3, symbol: "ARB", enabled: true, maxAllocation: 0.10, driftMarketIndex: 3 },
  { marketIndex: 4, symbol: "AVAX", enabled: true, maxAllocation: 0.10, driftMarketIndex: 4 },
  { marketIndex: 5, symbol: "LINK", enabled: true, maxAllocation: 0.08, driftMarketIndex: 5 },
  { marketIndex: 6, symbol: "MATIC", enabled: true, maxAllocation: 0.07, driftMarketIndex: 6 },
];

export const DEFAULT_RISK_PARAMS: RiskParams = {
  maxLeveragePerMarket: 5,
  maxTotalLeverage: 10,
  maxPositionPercent: 0.20,
  drawdownCircuitBreaker: 0.08,
  rebalanceThreshold: 0.05,
  stopLossPercent: 0.05,
  minFundingRateHourly: "100",
  cooldownSeconds: 300,
};

export const DRIFT_PROGRAM_ID = new PublicKey("driftKx3KzKzg1NNb8m6VGT9MzXwvEDdX8LvyM6s3u2V7");
export const VAULT_PROGRAM_ID = new PublicKey("vVoLTRjQmtFpiYoegx285Ze4gsLJ8ZxgFKVcuvmG1a8");
export const DRIFT_ADAPTOR_ID = new PublicKey("EBN93eXs5fHGBABuajQqdsKRkCgaqtJa8vEFD6vKXiP");
