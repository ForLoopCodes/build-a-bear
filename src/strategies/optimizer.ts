import { BN } from "bn.js";
import type { MarketFunding, Allocation, MarketConfig, FundingRateSnapshot } from "../types.js";
import { DRIFT_MARKETS } from "../types.js";

interface MarketScore {
  marketIndex: number;
  symbol: string;
  fundingScore: number;
  stabilityScore: number;
  depthScore: number;
  totalScore: number;
  direction: "long" | "short";
  estimatedApy: number;
}

export class FundingOptimizer {
  private markets: MarketConfig[];
  private historicalSnapshots: Map<number, FundingRateSnapshot[]> = new Map();

  constructor(markets: MarketConfig[] = DRIFT_MARKETS) {
    this.markets = markets;
  }

  analyzeMarkets(marketData: MarketFunding[]): MarketScore[] {
    const scores: MarketScore[] = [];

    for (const data of marketData) {
      const config = this.markets.find((m) => m.marketIndex === data.marketIndex);
      if (!config?.enabled) continue;

      const direction = data.openInterestShort.gt(data.openInterestLong)
        ? ("long" as const)
        : ("short" as const);

      const fundingScore = Math.abs(Number(data.fundingRateHourly) / 1e6);
      const stabilityScore = this.calculateStability(data.marketIndex);
      const depthScore = Math.min(data.marketDepth / 1e6, 1);
      const estimatedApy = Math.abs(data.fundingRateAnnualized);

      const totalScore = fundingScore * 0.6 + stabilityScore * 0.25 + depthScore * 0.15;

      scores.push({
        marketIndex: data.marketIndex,
        symbol: data.symbol,
        fundingScore,
        stabilityScore,
        depthScore,
        totalScore,
        direction,
        estimatedApy,
      });
    }

    return scores.sort((a, b) => b.totalScore - a.totalScore);
  }

  calculateOptimalAllocation(
    scores: MarketScore[],
    vaultValue: BN,
    currentAllocations: Allocation[]
  ): Allocation[] {
    const allocations: Allocation[] = [];
    const enabledMarkets = scores.filter((s) => {
      const config = this.markets.find((m) => m.symbol === s.symbol);
      return config?.enabled && s.estimatedApy > 0.5;
    });

    if (enabledMarkets.length === 0) return [];

    let remainingPercent = 1.0;
    const minAllocation = 0.05;
    const maxMarkets = Math.min(enabledMarkets.length, 5);

    for (let i = 0; i < maxMarkets && i < enabledMarkets.length; i++) {
      const score = enabledMarkets[i];
      const config = this.markets.find((m) => m.symbol === score.symbol);
      const maxAlloc = config?.maxAllocation || 0.15;

      let targetPercent: number;
      if (i === 0) {
        targetPercent = Math.min(Math.max(remainingPercent * 0.4, minAllocation), maxAlloc);
      } else {
        targetPercent = Math.min(Math.max(remainingPercent / (maxMarkets - i), minAllocation), maxAlloc);
      }
      remainingPercent -= targetPercent;

      const current = currentAllocations.find((a) => a.marketIndex === score.marketIndex);

      allocations.push({
        marketIndex: score.marketIndex,
        symbol: score.symbol,
        targetPercent,
        currentPercent: current?.currentPercent || 0,
        direction: score.direction,
        estimatedApy: score.estimatedApy,
        score: score.totalScore,
      });
    }

    if (remainingPercent > 0 && allocations.length > 0) {
      allocations[0].targetPercent += remainingPercent;
    }

    return allocations;
  }

  shouldRebalance(
    current: Allocation[],
    target: Allocation[],
    threshold: number = 0.05
  ): { should: boolean; changes: { market: string; from: number; to: number }[] } {
    const changes: { market: string; from: number; to: number }[] = [];

    for (const t of target) {
      const c = current.find((a) => a.marketIndex === t.marketIndex);
      const currentPct = c?.currentPercent || 0;
      if (Math.abs(t.targetPercent - currentPct) > threshold) {
        changes.push({ market: t.symbol, from: currentPct, to: t.targetPercent });
      }
    }

    return { should: changes.length > 0, changes };
  }

  updateHistory(marketIndex: number, snapshots: FundingRateSnapshot[]): void {
    this.historicalSnapshots.set(marketIndex, snapshots);
  }

  estimateMaxDrawdown(allocations: Allocation[], worstCase: number = 0.1): number {
    let portfolioStdDev = 0;
    for (const a of allocations) {
      portfolioStdDev += Math.pow(a.targetPercent * 2, 2);
    }
    return Math.sqrt(portfolioStdDev) * worstCase * 2;
  }

  private calculateStability(marketIndex: number): number {
    const history = this.historicalSnapshots.get(marketIndex) || [];
    if (history.length < 3) return 0.5;

    const rates = history.map((s) => Number(s.rate) / 1e6);
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
    const variance = rates.reduce((sum, r) => sum + Math.pow(r - avg, 2), 0) / rates.length;
    const stdDev = Math.sqrt(variance);

    const stability = avg !== 0 ? 1 - Math.min(stdDev / Math.abs(avg), 1) : 0;
    return Math.max(0, Math.min(1, stability));
  }
}
