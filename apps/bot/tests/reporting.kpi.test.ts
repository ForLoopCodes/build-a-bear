import { StrategyState } from "@build-a-bear/core";
import { buildKpiReport, formatKpiReport } from "../src/reporting";

describe("kpi reporting", () => {
  it("builds structured KPI report", () => {
    const report = buildKpiReport({
      date: "2026-03-25",
      state: StrategyState.Carry,
      summary: {
        grossPnl: 120,
        feesPaid: 10,
        slippagePaid: 5,
        netPnl: 105,
        realizedNetApy: 0.132,
      },
      fundingContribution: 0.08,
      basisContribution: 0.03,
      lendContribution: 0.02,
      maxIntradayDrawdownPct: -0.02,
      accountHealth: 72,
      notes: ["carry state active"],
    });

    expect(report.netApy).toBe(0.132);
    expect(report.feesAndSlippageContribution).toBe(-15);
    expect(report.state).toBe(StrategyState.Carry);
  });

  it("formats report for logs", () => {
    const report = buildKpiReport({
      date: "2026-03-25",
      state: StrategyState.Safety,
      summary: {
        grossPnl: 20,
        feesPaid: 0,
        slippagePaid: 0,
        netPnl: 20,
        realizedNetApy: 0.04,
      },
      fundingContribution: 0,
      basisContribution: 0,
      lendContribution: 0.04,
      maxIntradayDrawdownPct: -0.005,
      accountHealth: 80,
      notes: ["safety mode"],
    });

    const text = formatKpiReport(report);
    expect(text).toContain("state=safety");
    expect(text).toContain("netApy=0.0400");
    expect(text).toContain("notes=safety mode");
  });
});
