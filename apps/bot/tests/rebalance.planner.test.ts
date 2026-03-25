import { AllocationTarget } from "@build-a-bear/core";
import { planRebalanceActions } from "../src/rebalance";

describe("rebalance planner", () => {
  it("creates actions for material deltas", () => {
    const current: AllocationTarget[] = [
      { market: "BTC-PERP", targetWeight: 0.2 },
      { market: "ETH-PERP", targetWeight: 0.1 },
    ];
    const target: AllocationTarget[] = [
      { market: "BTC-PERP", targetWeight: 0.1 },
      { market: "ETH-PERP", targetWeight: 0.2 },
      { market: "SOL-PERP", targetWeight: 0.1 },
    ];

    const actions = planRebalanceActions(current, target, 0.01);

    expect(actions).toHaveLength(3);
    expect(actions[0].market).toBe("BTC-PERP");
  });

  it("drops actions below min delta", () => {
    const current: AllocationTarget[] = [{ market: "BTC-PERP", targetWeight: 0.2 }];
    const target: AllocationTarget[] = [{ market: "BTC-PERP", targetWeight: 0.205 }];

    const actions = planRebalanceActions(current, target, 0.01);
    expect(actions).toHaveLength(0);
  });

  it("includes closures when target allocation is zero", () => {
    const current: AllocationTarget[] = [{ market: "ETH-PERP", targetWeight: 0.15 }];
    const target: AllocationTarget[] = [];

    const actions = planRebalanceActions(current, target, 0.01);

    expect(actions).toHaveLength(1);
    expect(actions[0].market).toBe("ETH-PERP");
    expect(actions[0].toWeight).toBe(0);
  });
});
