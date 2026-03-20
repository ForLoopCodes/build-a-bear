import { BN } from "bn.js";
import type { Position, RiskParams, VaultState, Allocation } from "../types.js";
import { QUOTE_PRECISION } from "../config.js";
import type { DEFAULT_RISK_PARAMS } from "../types.js";

const defaultParams: RiskParams = {
  maxLeveragePerMarket: 5,
  maxTotalLeverage: 10,
  maxPositionPercent: 0.20,
  drawdownCircuitBreaker: 0.08,
  rebalanceThreshold: 0.05,
  stopLossPercent: 0.05,
  minFundingRateHourly: "100",
  cooldownSeconds: 300,
};

export class RiskManager {
  private params: RiskParams;
  private peakValue: BN;
  private pauseUntil: number = 0;

  constructor(params?: RiskParams) {
    this.params = params || defaultParams;
    this.peakValue = new BN(0);
  }

  updatePeak(value: BN): void {
    if (value.gt(this.peakValue)) {
      this.peakValue = value;
    }
  }

  checkDrawdown(currentValue: BN): number {
    if (this.peakValue.isZero()) return 0;
    const drawdown = this.peakValue.sub(currentValue).muln(100).div(this.peakValue);
    return Number(drawdown) / 100;
  }

  isCircuitBreakerTriggered(currentValue: BN): boolean {
    const drawdown = this.checkDrawdown(currentValue);
    if (Date.now() < this.pauseUntil) return true;
    if (drawdown >= this.params.drawdownCircuitBreaker) {
      this.pauseUntil = Date.now() + 3_600_000;
      return true;
    }
    return false;
  }

  validatePosition(position: Position, vaultValue: BN): { valid: boolean; reason?: string } {
    if (position.size.isZero()) return { valid: true };

    const posValueUsd = position.size.mul(position.currentPrice).div(QUOTE_PRECISION);
    const posPercent = posValueUsd.muln(100).div(vaultValue);
    const posPercentNum = Number(posPercent) / 100;

    if (posPercentNum > this.params.maxPositionPercent) {
      return { valid: false, reason: `Position exceeds max ${this.params.maxPositionPercent * 100}% of vault` };
    }

    const leverage = posValueUsd.div(vaultValue);
    if (Number(leverage) / 1e6 > this.params.maxLeveragePerMarket) {
      return { valid: false, reason: `Leverage exceeds max ${this.params.maxLeveragePerMarket}x` };
    }

    const pnlLoss = position.unrealizedPnl.muln(-1);
    const stopLossThreshold = vaultValue.muln(Math.floor(this.params.stopLossPercent * 100)).divn(100);
    if (!pnlLoss.isZero() && pnlLoss.gt(stopLossThreshold)) {
      return { valid: false, reason: `Stop loss triggered` };
    }

    return { valid: true };
  }

  validateRebalance(allocations: Allocation[], currentTime: number): {
    valid: boolean;
    reason?: string;
    shouldRebalance: boolean;
  } {
    if (this.isPaused()) {
      return { valid: false, reason: "Circuit breaker active", shouldRebalance: false };
    }

    const maxShift = Math.max(...allocations.map((a) => Math.abs(a.targetPercent - a.currentPercent)));
    if (maxShift < this.params.rebalanceThreshold) {
      return { valid: true, shouldRebalance: false };
    }

    return { valid: true, shouldRebalance: true };
  }

  isPaused(): boolean {
    return Date.now() < this.pauseUntil;
  }

  getMaxPositionSize(vaultValue: BN, leverage: number = 1): BN {
    return vaultValue.muln(leverage).muln(Math.floor(this.params.maxPositionPercent * 100)).divn(100);
  }

  calculateLeverage(positions: Position[], vaultValue: BN): number {
    if (vaultValue.isZero()) return 0;
    let totalExposure = new BN(0);
    for (const p of positions) {
      totalExposure = totalExposure.add(p.size.mul(p.currentPrice).div(QUOTE_PRECISION));
    }
    return Number(totalExposure) / Number(vaultValue);
  }

  getParams(): RiskParams {
    return { ...this.params };
  }

  updateParams(updates: Partial<RiskParams>): void {
    this.params = { ...this.params, ...updates };
  }
}
