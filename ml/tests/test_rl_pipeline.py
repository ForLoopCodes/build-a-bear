import unittest

from ml_pipeline.rl import SimplePolicyTrainer, TradingEnvironment


def make_feature(carry: float) -> dict[str, float | str]:
    return {
        "timestamp": "2026-03-25T00:00:00Z",
        "market": "BTC-PERP",
        "funding_momentum_4h": 0.00001,
        "basis_z_24h": 0.2,
        "spread_to_volatility": 0.01,
        "carry_edge_apy": carry,
        "mark_oracle_divergence_bps": 4,
        "volatility_24h": 0.04,
    }


def make_label(value: float) -> dict[str, float | str]:
    return {
        "timestamp": "2026-03-25T00:00:00Z",
        "market": "BTC-PERP",
        "realized_next_4h_net_apy": value,
    }


class TestRlPipeline(unittest.TestCase):
    def test_environment_step(self) -> None:
        env = TradingEnvironment(
            features=[make_feature(0.1), make_feature(0.12)],
            labels=[make_label(0.09), make_label(0.11)],
        )
        env.reset()
        _, reward, done, info = env.step(0.5)
        self.assertFalse(done)
        self.assertIn("pnl_component", info)
        self.assertGreater(reward, -1)

    def test_trainer_finds_action(self) -> None:
        env = TradingEnvironment(
            features=[make_feature(0.1), make_feature(0.12), make_feature(0.13)],
            labels=[make_label(0.08), make_label(0.1), make_label(0.11)],
        )
        trainer = SimplePolicyTrainer(action_grid=[0.0, 0.25, 0.5, 0.75, 1.0])
        result = trainer.train(env, episodes=3)
        self.assertIn("best_action", result)
        self.assertIn("best_reward", result)
        self.assertIn("reward_mean", result)
        self.assertGreaterEqual(result["best_action"], 0)
        self.assertLessEqual(result["best_action"], 1)

        grid_result = trainer.train_grid_search(env, episodes=2)
        self.assertIn("best_action", grid_result)


if __name__ == "__main__":
    unittest.main()
