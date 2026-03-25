import { z } from "zod";

export enum StrategyState {
  Safety = "safety",
  Carry = "carry",
  Spread = "spread",
}

export enum RiskLevel {
  Normal = "normal",
  Warning = "warning",
  Critical = "critical",
}

export const marketSnapshotSchema = z.object({
  timestamp: z.string().min(1),
  market: z.string().min(1),
  fundingRateHourly: z.number(),
  basisBps: z.number(),
  markOracleDivergenceBps: z.number().nonnegative(),
  bidAskSpreadBps: z.number().nonnegative(),
  volume1h: z.number().nonnegative(),
  openInterest: z.number().nonnegative(),
  volatility1h: z.number().nonnegative(),
  volatility24h: z.number().nonnegative(),
  lendApy: z.number(),
  borrowApy: z.number(),
  utilization: z.number().min(0).max(1),
  estimatedExecutionCostBps: z.number().nonnegative(),
  referencePrice: z.number().positive().optional(),
});

export const riskSnapshotSchema = z.object({
  accountHealth: z.number().min(0).max(100),
  drawdownDailyPct: z.number().max(0),
  drawdownRollingPct: z.number().max(0),
  liquidationDistancePct: z.number().min(0),
  telemetryHealthy: z.boolean(),
});

export const featureVectorSchema = marketSnapshotSchema.extend({
  fundingMomentum4h: z.number(),
  basisZScore24h: z.number(),
  spreadToVolatilityRatio: z.number().nonnegative(),
  carryEdgeApy: z.number(),
});

export const edgeSignalSchema = z.object({
  market: z.string(),
  expectedNetApy: z.number(),
  confidence: z.number().min(0).max(1),
});

export const regimeSignalSchema = z.object({
  stableCarryProbability: z.number().min(0).max(1),
  unstableCarryProbability: z.number().min(0).max(1),
  riskOffProbability: z.number().min(0).max(1),
});

export const allocationTargetSchema = z.object({
  market: z.string(),
  targetWeight: z.number().min(0).max(1),
});

export const rebalanceActionSchema = z.object({
  market: z.string(),
  fromWeight: z.number().min(0).max(1),
  toWeight: z.number().min(0).max(1),
  deltaWeight: z.number(),
});

export type MarketSnapshot = z.infer<typeof marketSnapshotSchema>;
export type RiskSnapshot = z.infer<typeof riskSnapshotSchema>;
export type FeatureVector = z.infer<typeof featureVectorSchema>;
export type EdgeSignal = z.infer<typeof edgeSignalSchema>;
export type RegimeSignal = z.infer<typeof regimeSignalSchema>;
export type AllocationTarget = z.infer<typeof allocationTargetSchema>;
export type RebalanceAction = z.infer<typeof rebalanceActionSchema>;

export type RiskDecision = {
  isTradingAllowed: boolean;
  riskLevel: RiskLevel;
  maxGrossExposureMultiplier: number;
  forceSafetyState: boolean;
  reasons: string[];
};

export type StrategyDecision = {
  nextState: StrategyState;
  allocations: AllocationTarget[];
  reasons: string[];
};

export type SimulationSummary = {
  grossPnl: number;
  feesPaid: number;
  slippagePaid: number;
  netPnl: number;
  realizedNetApy: number;
};

export type KpiReport = {
  date: string;
  state: StrategyState;
  netApy: number;
  grossPnl: number;
  netPnl: number;
  fundingContribution: number;
  basisContribution: number;
  lendContribution: number;
  feesAndSlippageContribution: number;
  maxIntradayDrawdownPct: number;
  accountHealth: number;
  notes: string[];
};
