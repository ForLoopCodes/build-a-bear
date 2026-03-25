import {
  FeatureVector,
  MarketSnapshot,
  featureVectorSchema,
} from "@build-a-bear/core";

const EPSILON = 1e-9;

function avg(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function stdev(values: number[]): number {
  if (values.length < 2) {
    return 0;
  }
  const mean = avg(values);
  const variance = avg(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
}

export function buildFeatureVectors(
  latestSnapshots: MarketSnapshot[],
  historicalSnapshots: MarketSnapshot[],
): FeatureVector[] {
  const historyByMarket = new Map<string, MarketSnapshot[]>();

  historicalSnapshots.forEach((snapshot) => {
    const series = historyByMarket.get(snapshot.market) ?? [];
    series.push(snapshot);
    historyByMarket.set(snapshot.market, series);
  });

  latestSnapshots.forEach((snapshot) => {
    const series = historyByMarket.get(snapshot.market) ?? [];
    series.push(snapshot);
    historyByMarket.set(snapshot.market, series);
  });

  return latestSnapshots.map((snapshot) => {
    const series = historyByMarket.get(snapshot.market) ?? [snapshot];
    const fundingWindow = series.slice(-4).map((point) => point.fundingRateHourly);
    const basisWindow = series.slice(-24).map((point) => point.basisBps);

    const fundingMomentum4h =
      fundingWindow.length > 1
        ? fundingWindow[fundingWindow.length - 1] - fundingWindow[0]
        : 0;

    const basisMean = avg(basisWindow);
    const basisStd = stdev(basisWindow);
    const basisZScore24h = (snapshot.basisBps - basisMean) / Math.max(basisStd, EPSILON);

    const spreadToVolatilityRatio =
      snapshot.bidAskSpreadBps / Math.max(snapshot.volatility1h * 10_000, EPSILON);

    const carryEdgeApy =
      snapshot.lendApy + snapshot.fundingRateHourly * 24 * 365.25 - snapshot.borrowApy;

    return featureVectorSchema.parse({
      ...snapshot,
      fundingMomentum4h,
      basisZScore24h,
      spreadToVolatilityRatio,
      carryEdgeApy,
    });
  });
}
