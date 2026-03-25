import { RiskDecision, RiskLevel, RiskSnapshot } from "@build-a-bear/core";
import { BotConfig } from "../config";

export function evaluateRiskPolicy(snapshot: RiskSnapshot, config: BotConfig): RiskDecision {
  const reasons: string[] = [];

  if (!snapshot.telemetryHealthy) {
    reasons.push("Telemetry feed unhealthy");
  }

  if (snapshot.accountHealth <= config.healthHardLimit) {
    reasons.push("Account health breached hard limit");
  } else if (snapshot.accountHealth <= config.healthSoftLimit) {
    reasons.push("Account health breached soft limit");
  }

  if (snapshot.drawdownDailyPct <= config.dailyHardDrawdownPct) {
    reasons.push("Daily drawdown breached hard limit");
  } else if (snapshot.drawdownDailyPct <= config.dailySoftDrawdownPct) {
    reasons.push("Daily drawdown breached soft limit");
  }

  if (snapshot.drawdownRollingPct <= config.rollingHardDrawdownPct) {
    reasons.push("Rolling drawdown breached hard limit");
  }

  const critical = reasons.some((reason) =>
    reason.includes("hard") || reason.includes("Telemetry"),
  );

  if (critical) {
    return {
      isTradingAllowed: false,
      riskLevel: RiskLevel.Critical,
      maxGrossExposureMultiplier: 0,
      forceSafetyState: true,
      reasons,
    };
  }

  const warning = reasons.length > 0;
  if (warning) {
    return {
      isTradingAllowed: true,
      riskLevel: RiskLevel.Warning,
      maxGrossExposureMultiplier: Math.min(config.maxGrossExposureMultiplier, 1.0),
      forceSafetyState: false,
      reasons,
    };
  }

  return {
    isTradingAllowed: true,
    riskLevel: RiskLevel.Normal,
    maxGrossExposureMultiplier: config.maxGrossExposureMultiplier,
    forceSafetyState: false,
    reasons: ["Risk profile within limits"],
  };
}
