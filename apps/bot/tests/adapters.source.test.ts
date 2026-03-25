import { DriftDataSource } from "../src/adapters";

describe("drift source adapter", () => {
  it("returns snapshots for requested markets", async () => {
    const source = new DriftDataSource();
    const snapshots = await source.fetchMarketSnapshots(
      ["BTC-PERP", "ETH-PERP", "SOL-PERP"],
      "2026-03-25T12:00:00.000Z",
    );

    expect(snapshots).toHaveLength(3);
    expect(snapshots[0].timestamp).toBe("2026-03-25T12:00:00.000Z");
  });

  it("ignores unknown markets", async () => {
    const source = new DriftDataSource();
    const snapshots = await source.fetchMarketSnapshots(
      ["BTC-PERP", "UNKNOWN"],
      "2026-03-25T12:00:00.000Z",
    );

    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].market).toBe("BTC-PERP");
  });

  it("returns risk snapshot", async () => {
    const source = new DriftDataSource();
    const risk = await source.fetchRiskSnapshot();
    expect(risk.accountHealth).toBeGreaterThan(0);
    expect(risk.telemetryHealthy).toBe(true);
  });
});
