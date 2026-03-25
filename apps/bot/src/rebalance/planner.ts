import {
  AllocationTarget,
  RebalanceAction,
  rebalanceActionSchema,
} from "@build-a-bear/core";

export function planRebalanceActions(
  current: AllocationTarget[],
  target: AllocationTarget[],
  minDelta: number,
): RebalanceAction[] {
  const currentByMarket = new Map(current.map((item) => [item.market, item.targetWeight]));
  const targetByMarket = new Map(target.map((item) => [item.market, item.targetWeight]));
  const allMarkets = new Set([...currentByMarket.keys(), ...targetByMarket.keys()]);

  const actions: RebalanceAction[] = [];
  allMarkets.forEach((market) => {
    const fromWeight = currentByMarket.get(market) ?? 0;
    const toWeight = targetByMarket.get(market) ?? 0;
    const deltaWeight = toWeight - fromWeight;

    if (Math.abs(deltaWeight) < minDelta) {
      return;
    }

    actions.push(
      rebalanceActionSchema.parse({
        market,
        fromWeight,
        toWeight,
        deltaWeight,
      }),
    );
  });

  return actions.sort((a, b) => Math.abs(b.deltaWeight) - Math.abs(a.deltaWeight));
}
