import type { VaultState, Position, Allocation, RiskParams } from "../types.js";

export class MonitoringDashboard {
  private vaultState: VaultState;
  private riskParams: RiskParams;
  private history: { timestamp: number; tvl: number; pnl: number; dd: number }[] = [];

  constructor(vaultState: VaultState, riskParams: RiskParams) {
    this.vaultState = vaultState;
    this.riskParams = riskParams;
  }

  update(vaultState: VaultState): void {
    this.vaultState = vaultState;
    this.history.push({
      timestamp: Date.now(),
      tvl: Number(vaultState.totalValue) / 1e6,
      pnl: Number(vaultState.totalPnl) / 1e6,
      dd: vaultState.currentDrawdown * 100,
    });
    if (this.history.length > 1000) this.history.shift();
  }

  render(): string {
    const lines: string[] = [];
    lines.push("╔══════════════════════════════════════════════════════════════════════╗");
    lines.push("║                    DRIFTPACK VAULT MONITORING                        ║");
    lines.push("╠══════════════════════════════════════════════════════════════════════╣");
    lines.push(`║ ${this.timestamp()}                                                    ║`);
    lines.push("╠══════════════════════════════════════════════════════════════════════╣");
    lines.push("║ VAULT SUMMARY                                                        ║");
    lines.push(`║   Total Value:     $${this.fmt(this.tv)}                                       ║`);
    lines.push(`║   Deployed Value:  $${this.fmt(this.dv)}                                       ║`);
    lines.push(`║   Idle Value:      $${this.fmt(this.iv)}                                        ║`);
    lines.push(`║   Total PnL:       $${this.fmt(this.pn)}  (${this.pnlPct.toFixed(2)}%)                        ║`);
    lines.push(`║   Daily PnL:       $${this.fmt(this.dpn)}                                       ║`);
    lines.push(`║   Current DD:      ${this.dd.toFixed(2)}%  (max: ${this.maxDd.toFixed(2)}%)                     ║`);
    lines.push(`║   Status:          ${this.status.padEnd(50)}║`);
    lines.push("╠══════════════════════════════════════════════════════════════════════╣");
    lines.push("║ OPEN POSITIONS                                                       ║");
    if (this.vaultState.positions.length === 0) {
      lines.push("║   No open positions                                                  ║");
    } else {
      for (const pos of this.vaultState.positions) {
        const pnlStr = `${(Number(pos.unrealizedPnl) / 1e6).toFixed(2)}`;
        lines.push(`║   ${pos.symbol.padEnd(6)} ${pos.direction.padEnd(5)} ${(Number(pos.size) / 1e6).toFixed(0).padStart(8)} ${pnlStr.padStart(10)} $ ${(Number(pos.currentPrice) / 1e6).toFixed(2).padStart(10)}    ║`);
      }
    }
    lines.push("╠══════════════════════════════════════════════════════════════════════╣");
    lines.push("║ ALLOCATIONS                                                          ║");
    if (this.vaultState.allocations.length === 0) {
      lines.push("║   No active allocations                                             ║");
    } else {
      for (const alloc of this.vaultState.allocations) {
        const apyStr = `${alloc.estimatedApy.toFixed(1)}%`;
        lines.push(`║   ${alloc.symbol.padEnd(6)} ${alloc.direction.padEnd(5)} ${(alloc.targetPercent * 100).toFixed(1).padStart(5)}% APY ${apyStr.padStart(8)} score ${alloc.score.toFixed(2).padStart(5)}  ║`);
      }
    }
    lines.push("╠══════════════════════════════════════════════════════════════════════╣");
    lines.push("║ RISK METRICS                                                         ║");
    lines.push(`║   Max Leverage/Pos: ${this.riskParams.maxLeveragePerMarket}x                                  ║`);
    lines.push(`║   Total Leverage:   ${this.totalLeverage.toFixed(2)}x                                       ║`);
    lines.push(`║   Max Pos Per Mkt:  ${this.riskParams.maxPositionPercent * 100}%                                   ║`);
    lines.push(`║   Rebalance Thr:    ${this.riskParams.rebalanceThreshold * 100}%                                   ║`);
    lines.push(`║   Circuit Brk:      ${this.riskParams.drawdownCircuitBreaker * 100}%                                   ║`);
    lines.push(`║   Last Rebalance:   ${this.lastRebalance}                                  ║`);
    lines.push("╚══════════════════════════════════════════════════════════════════════╝");
    return lines.join("\n");
  }

  getMetrics(): {
    tvl: number;
    pnl: number;
    pnlPct: number;
    dd: number;
    maxDd: number;
    positions: Position[];
    allocations: Allocation[];
    status: string;
    estimatedApy: number;
  } {
    const estimatedApy = this.vaultState.allocations.reduce((sum, a) => sum + a.estimatedApy * a.targetPercent, 0);
    return {
      tvl: Number(this.vaultState.totalValue) / 1e6,
      pnl: Number(this.vaultState.totalPnl) / 1e6,
      pnlPct: this.vaultState.totalValue === "0" ? 0 : (Number(this.vaultState.totalPnl) / Number(this.vaultState.totalValue)) * 100,
      dd: this.vaultState.currentDrawdown * 100,
      maxDd: this.vaultState.maxDrawdown * 100,
      positions: JSON.parse(JSON.stringify(this.vaultState.positions)),
      allocations: JSON.parse(JSON.stringify(this.vaultState.allocations)),
      status: this.vaultState.isPaused ? "PAUSED" : "ACTIVE",
      estimatedApy,
    };
  }

  getHistory(): { timestamp: number; tvl: number; pnl: number; dd: number }[] {
    return [...this.history];
  }

  private get tv(): number { return Number(this.vaultState.totalValue) / 1e6; }
  private get dv(): number { return Number(this.vaultState.deployedValue) / 1e6; }
  private get iv(): number { return Number(this.vaultState.idleValue) / 1e6; }
  private get pn(): number { return Number(this.vaultState.totalPnl) / 1e6; }
  private get dpn(): number { return Number(this.vaultState.dailyPnl) / 1e6; }
  private get dd(): number { return this.vaultState.currentDrawdown * 100; }
  private get maxDd(): number { return this.vaultState.maxDrawdown * 100; }
  private get status(): string { return this.vaultState.isPaused ? "** PAUSED - CIRCUIT BREAKER **" : "ACTIVE"; }
  private get pnlPct(): number { return this.tv === 0 ? 0 : (this.pn / this.tv) * 100; }
  private get totalLeverage(): number {
    if (this.tv === 0) return 0;
    const deployed = this.vaultState.positions.reduce((sum, p) => sum + Number(p.size) / 1e6, 0);
    return deployed / this.tv;
  }
  private get lastRebalance(): string {
    if (this.vaultState.lastRebalance === 0) return "Never";
    const ago = Math.floor((Date.now() - this.vaultState.lastRebalance) / 1000);
    if (ago < 60) return `${ago}s ago`;
    if (ago < 3600) return `${Math.floor(ago / 60)}m ago`;
    return `${Math.floor(ago / 3600)}h ago`;
  }

  private fmt(v: number): string { return v.toFixed(2).padStart(12); }
  private timestamp(): string { return new Date().toISOString().replace("T", " ").substring(0, 19); }
}
