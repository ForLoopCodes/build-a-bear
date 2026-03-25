import { KpiReport, SimulationSummary, StrategyState } from "@build-a-bear/core";

export type KpiInput = {
  date: string;
  state: StrategyState;
  summary: SimulationSummary;
  fundingContribution: number;
  basisContribution: number;
  lendContribution: number;
  maxIntradayDrawdownPct: number;
  accountHealth: number;
  notes?: string[];
};

export function buildKpiReport(input: KpiInput): KpiReport {
  return {
    date: input.date,
    state: input.state,
    netApy: input.summary.realizedNetApy,
    grossPnl: input.summary.grossPnl,
    netPnl: input.summary.netPnl,
    fundingContribution: input.fundingContribution,
    basisContribution: input.basisContribution,
    lendContribution: input.lendContribution,
    feesAndSlippageContribution: -(input.summary.feesPaid + input.summary.slippagePaid),
    maxIntradayDrawdownPct: input.maxIntradayDrawdownPct,
    accountHealth: input.accountHealth,
    notes: input.notes ?? [],
  };
}

export function formatKpiReport(report: KpiReport): string {
  const lines = [
    `date=${report.date}`,
    `state=${report.state}`,
    `netApy=${report.netApy.toFixed(4)}`,
    `grossPnl=${report.grossPnl.toFixed(2)}`,
    `netPnl=${report.netPnl.toFixed(2)}`,
    `fundingContribution=${report.fundingContribution.toFixed(4)}`,
    `basisContribution=${report.basisContribution.toFixed(4)}`,
    `lendContribution=${report.lendContribution.toFixed(4)}`,
    `feesAndSlippageContribution=${report.feesAndSlippageContribution.toFixed(2)}`,
    `maxIntradayDrawdownPct=${report.maxIntradayDrawdownPct.toFixed(4)}`,
    `accountHealth=${report.accountHealth.toFixed(2)}`,
  ];

  if (report.notes.length) {
    lines.push(`notes=${report.notes.join(" | ")}`);
  }

  return lines.join("\n");
}
