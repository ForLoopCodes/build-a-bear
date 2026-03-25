import { botBanner, getScaffoldSnapshots } from "../src";

describe("bot package scaffolding", () => {
  it("builds a banner that references core package", () => {
    expect(botBanner()).toContain("@build-a-bear/core");
  });

  it("loads scaffold market snapshots", async () => {
    await expect(getScaffoldSnapshots(["BTC-PERP", "ETH-PERP"]))
      .resolves
      .toBe(2);
  });
});
