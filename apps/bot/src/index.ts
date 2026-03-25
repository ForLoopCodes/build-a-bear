import { corePackageName } from "@build-a-bear/core";
import { DriftDataSource } from "./adapters";

export function botBanner(): string {
  return `build-a-bear bot powered by ${corePackageName}`;
}

export async function getScaffoldSnapshots(markets: string[]): Promise<number> {
  const source = new DriftDataSource();
  const snapshots = await source.fetchMarketSnapshots(markets, new Date().toISOString());
  return snapshots.length;
}
