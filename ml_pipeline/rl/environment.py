from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Tuple


@dataclass
class TradingEnvironment:
    features: List[Dict[str, float | str]]
    labels: List[Dict[str, float | str]]
    fee_penalty: float = 0.15
    drawdown_penalty: float = 0.2
    turnover_penalty: float = 0.05

    def __post_init__(self) -> None:
        if len(self.features) != len(self.labels):
            raise ValueError("features and labels length mismatch")
        self.index = 0
        self.last_action = 0.0

    def reset(self) -> Dict[str, float | str]:
        self.index = 0
        self.last_action = 0.0
        return self.features[self.index]

    def step(self, action: float) -> Tuple[Dict[str, float | str], float, bool, Dict[str, float]]:
        action = max(0.0, min(1.0, action))
        label = self.labels[self.index]
        realized = float(label["realized_next_4h_net_apy"])

        pnl_component = action * realized
        fee_component = self.fee_penalty * abs(action - self.last_action)
        drawdown_component = self.drawdown_penalty * max(0.0, -realized)
        turnover_component = self.turnover_penalty * abs(action - self.last_action)

        reward = pnl_component - fee_component - drawdown_component - turnover_component

        self.last_action = action
        self.index += 1
        done = self.index >= len(self.features)
        next_state = self.features[-1] if done else self.features[self.index]

        info = {
            "pnl_component": pnl_component,
            "fee_component": fee_component,
            "drawdown_component": drawdown_component,
            "turnover_component": turnover_component,
        }
        return next_state, reward, done, info
