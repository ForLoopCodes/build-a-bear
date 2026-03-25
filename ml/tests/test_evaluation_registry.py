import unittest

from ml_pipeline.evaluation import InMemoryModelRegistry, evaluate_walk_forward


def make_feature(carry: float) -> dict[str, float | str]:
    return {
        "timestamp": "2026-03-25T00:00:00Z",
        "market": "BTC-PERP",
        "funding_momentum_4h": 0.00002,
        "basis_z_24h": 0.5,
        "spread_to_volatility": 0.02,
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


class TestEvaluationAndRegistry(unittest.TestCase):
    def test_walk_forward_metrics(self) -> None:
        features = [make_feature(0.1 + i * 0.005) for i in range(12)]
        labels = [make_label(0.09 + i * 0.004) for i in range(12)]
        metrics = evaluate_walk_forward(features, labels, train_window=6, test_window=2)
        self.assertIn("mse", metrics)
        self.assertIn("rmse", metrics)
        self.assertGreaterEqual(metrics["num_predictions"], 2)

    def test_registry_register_and_latest(self) -> None:
        registry = InMemoryModelRegistry()
        first = registry.register("edge_model", "v1", {"rmse": 0.02})
        second = registry.register("edge_model", "v2", {"rmse": 0.018})
        latest = registry.latest("edge_model")
        self.assertEqual(first["model_name"], "edge_model")
        self.assertEqual(second["version"], "v2")
        self.assertIsNotNone(latest)
        self.assertEqual(latest["version"], "v2")


if __name__ == "__main__":
    unittest.main()
