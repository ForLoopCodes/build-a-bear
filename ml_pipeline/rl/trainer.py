from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List

from .environment import TradingEnvironment


@dataclass
class SimplePolicyTrainer:
    action_grid: List[float]

    def train(self, env: TradingEnvironment, episodes: int = 5) -> Dict[str, float]:
        if not self.action_grid:
            raise ValueError("action grid cannot be empty")

        best_action = self.action_grid[0]
        best_reward = float("-inf")

        for action in self.action_grid:
            cumulative = 0.0
            for _ in range(episodes):
                env.reset()
                done = False
                while not done:
                    _, reward, done, _ = env.step(action)
                    cumulative += reward
            average_reward = cumulative / episodes
            if average_reward > best_reward:
                best_reward = average_reward
                best_action = action

        return {
            "best_action": best_action,
            "best_reward": best_reward,
        }
