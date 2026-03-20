import { BN } from "bn.js";
import { Keypair } from "@solana/web3.js";
import { config, REBALANCE_INTERVAL_MS, FUNDING_CHECK_INTERVAL_MS, QUOTE_PRECISION } from "./config.js";
import type { VaultState, Position, Allocation, MarketFunding } from "./types.js";
import { DriftApiClient } from "./api/drift.js";
import { RangerApiClient } from "./api/ranger.js";
import { DriftAdaptor } from "./adaptors/drift.js";
import { RiskManager } from "./risk/manager.js";
import { FundingOptimizer } from "./strategies/optimizer.js";

export class DriftPackVault {
  private driftApi: DriftApiClient;
  private rangerApi: RangerApiClient;
  private driftAdaptor: DriftAdaptor | null = null;
  private riskManager: RiskManager;
  private optimizer: FundingOptimizer;
  private vaultAddress: string = "";
  private vaultState: VaultState;
  private isRunning: boolean = false;
  private intervals: ReturnType<typeof setInterval>[] = [];

  constructor(apiKey: string) {
    this.driftApi = new DriftApiClient();
    this.rangerApi = new RangerApiClient(apiKey);
    this.riskManager = new RiskManager(config.risk);
    this.optimizer = new FundingOptimizer(config.markets);
    this.vaultState = this.initVaultState();
  }

  private initVaultState(): VaultState {
    return {
      totalValue: "0",
      deployedValue: "0",
      idleValue: "0",
      totalPnl: "0",
      dailyPnl: "0",
      currentDrawdown: 0,
      maxDrawdown: 0,
      lastRebalance: 0,
      isPaused: false,
      positions: [],
      allocations: [],
    };
  }

  async initialize(keypair: Keypair): Promise<void> {
    this.driftAdaptor = new DriftAdaptor(keypair);
    await this.syncVaultState();
  }

  async syncVaultState(): Promise<void> {
    if (!this.driftAdaptor) return;

    const positions = this.driftAdaptor.getPositions();
    const totalValue = this.driftAdaptor.getTotalPositionValue();
    const pnl = this.driftAdaptor.getAccountPnl();

    this.vaultState.positions = positions;
    const tv = totalValue.isZero() ? new BN("1000000000000") : totalValue;
    this.vaultState.totalValue = tv.toString();
    this.vaultState.deployedValue = totalValue.toString();
    this.vaultState.idleValue = tv.sub(totalValue).toString();
    this.vaultState.totalPnl = pnl.toString();
    this.vaultState.currentDrawdown = this.riskManager.checkDrawdown(tv);
    this.riskManager.updatePeak(tv);
    this.vaultState.isPaused = this.riskManager.isCircuitBreakerTriggered(tv);
  }

  async scanFundingRates(): Promise<MarketFunding[]> {
    return await this.driftApi.getAllPerpMarkets();
  }

  async rebalance(): Promise<void> {
    if (this.vaultState.isPaused || !this.driftAdaptor) return;

    const marketData = await this.scanFundingRates();
    const scores = this.optimizer.analyzeMarkets(marketData);
    const targetAllocations = this.optimizer.calculateOptimalAllocation(
      scores,
      new BN(this.vaultState.totalValue),
      this.vaultState.allocations
    );

    const rebalanceCheck = this.optimizer.shouldRebalance(
      this.vaultState.allocations,
      targetAllocations,
      config.risk.rebalanceThreshold
    );

    if (!rebalanceCheck.should) return;

    for (const change of rebalanceCheck.changes) {
      const allocation = targetAllocations.find((a) => a.symbol === change.market);
      if (!allocation) continue;

      const pos = this.vaultState.positions.find((p) => p.symbol === change.market);
      const newSize = new BN(this.vaultState.totalValue).muln(allocation.targetPercent).divn(100);
      const currentSize = pos?.size || new BN(0);

      if (currentSize.isZero() && allocation.targetPercent > 0) {
        await this.driftAdaptor.openPosition(allocation.marketIndex, allocation.direction, newSize);
      } else if (!currentSize.isZero()) {
        if (allocation.targetPercent === 0 || allocation.direction !== pos?.direction) {
          await this.driftAdaptor.closePosition(allocation.marketIndex);
          if (allocation.targetPercent > 0) {
            await this.driftAdaptor.openPosition(allocation.marketIndex, allocation.direction, newSize);
          }
        } else {
          const diff = newSize.sub(currentSize);
          const threshold = new BN(this.vaultState.totalValue).muln(500).divn(1000000);
          if (diff.abs().gt(threshold)) {
            if (diff.gt(new BN(0))) {
              await this.driftAdaptor.openPosition(allocation.marketIndex, allocation.direction, diff);
            } else {
              await this.driftAdaptor.closePosition(allocation.marketIndex);
            }
          }
        }
      }
    }

    this.vaultState.allocations = targetAllocations;
    this.vaultState.lastRebalance = Date.now();
    await this.syncVaultState();
  }

  async run(): Promise<void> {
    this.isRunning = true;
    console.log(`[${new Date().toISOString()}] DriftPack Vault started`);

    this.intervals.push(
      setInterval(async () => {
        try {
          await this.syncVaultState();
          if (!this.vaultState.isPaused) {
            await this.rebalance();
          }
          this.emitStatus();
        } catch (err) {
          console.error(`[${new Date().toISOString()}] Error in main loop:`, err);
        }
      }, REBALANCE_INTERVAL_MS)
    );

    this.intervals.push(
      setInterval(async () => {
        try {
          const marketData = await this.scanFundingRates();
          const scores = this.optimizer.analyzeMarkets(marketData);
          const top = scores.slice(0, 3).map((s) => `${s.symbol}: ${s.estimatedApy.toFixed(1)}%`).join(", ");
          console.log(`[${new Date().toISOString()}] Top markets: ${top}`);
        } catch (err) {
          console.error(`[${new Date().toISOString()}] Funding scan error:`, err);
        }
      }, FUNDING_CHECK_INTERVAL_MS)
    );
  }

  stop(): void {
    this.isRunning = false;
    this.intervals.forEach((i) => clearInterval(i));
    this.intervals = [];
    console.log(`[${new Date().toISOString()}] DriftPack Vault stopped`);
  }

  private emitStatus(): void {
    const pnlStr = (Number(this.vaultState.totalPnl) / 1e6).toFixed(2);
    const valStr = (Number(this.vaultState.totalValue) / 1e6).toFixed(2);
    const ddStr = (this.vaultState.currentDrawdown * 100).toFixed(2);
    const posCount = this.vaultState.positions.length;
    const status = this.vaultState.isPaused ? "PAUSED" : "ACTIVE";
    console.log(`[${new Date().toISOString()}] TVL $${valStr} | PnL $${pnlStr} | DD ${ddStr}% | Positions ${posCount} | ${status}`);
  }

  getState(): VaultState {
    return JSON.parse(JSON.stringify(this.vaultState));
  }

  async emergencyWithdraw(): Promise<void> {
    if (this.driftAdaptor) {
      await this.driftAdaptor.closeAllPositions();
      await this.syncVaultState();
    }
  }

  async createVault(vaultName: string, manager: Keypair): Promise<string> {
    const vaultAddress = await this.rangerApi.buildVaultAddress(vaultName, manager.publicKey.toBase58());
    this.vaultAddress = vaultAddress;
    return vaultAddress;
  }
}
