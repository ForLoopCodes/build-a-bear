from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List

import numpy as np

from .environment import TradingEnvironment


@dataclass
class SimplePolicyTrainer:
    action_grid: List[float]
    learning_rate: float = 0.05
    exploration_noise: float = 0.1
    seed: int = 42

    def train(self, env: TradingEnvironment, episodes: int = 5) -> Dict[str, float]:
        if not self.action_grid:
            raise ValueError("action grid cannot be empty")

        rng = np.random.default_rng(self.seed)
        policy_action = float(np.median(self.action_grid))
        best_action = policy_action
        best_reward = float("-inf")

        episode_rewards: List[float] = []
        for episode in range(max(episodes, 1)):
            env.reset()
            done = False
            cumulative = 0.0
            while not done:
                noisy_action = float(np.clip(policy_action + rng.normal(0, self.exploration_noise), 0.0, 1.0))
                _, reward, done, _ = env.step(noisy_action)
                cumulative += reward

            episode_rewards.append(cumulative)

            gradient_estimate = np.sign(cumulative)
            policy_action = float(np.clip(policy_action + self.learning_rate * gradient_estimate, 0.0, 1.0))

            if cumulative > best_reward:
                best_reward = cumulative
                best_action = policy_action

        return {
            "best_action": best_action,
            "best_reward": best_reward,
            "policy_action": policy_action,
            "reward_mean": float(np.mean(episode_rewards)) if episode_rewards else 0.0,
            "reward_std": float(np.std(episode_rewards)) if episode_rewards else 0.0,
        }

    def train_grid_search(self, env: TradingEnvironment, episodes: int = 5) -> Dict[str, float]:
        if not self.action_grid:
            raise ValueError("action grid cannot be empty")

        best_action = self.action_grid[0]
        best_reward = float("-inf")

        for action in self.action_grid:
            cumulative = 0.0
            for _ in range(max(episodes, 1)):
                env.reset()
                done = False
                while not done:
                    _, reward, done, _ = env.step(action)
                    cumulative += reward
            average_reward = cumulative / max(episodes, 1)
            if average_reward > best_reward:
                best_reward = average_reward
                best_action = action

        return {
            "best_action": best_action,
            "best_reward": best_reward,
        }
