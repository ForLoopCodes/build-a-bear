import unittest

from ml_pipeline.training.pipeline import run_training_pipeline


def rows() -> list[dict[str, float | str]]:
    payload: list[dict[str, float | str]] = []
    for index in range(12):
        payload.append(
            {
                "timestamp": f"2026-03-25T{index:02d}:00:00Z",
                "market": "BTC-PERP",
                "funding_rate_hourly": 0.0001 + index * 0.000005,
                "basis_bps": 10 + index,
                "mark_oracle_divergence_bps": 5,
                "bid_ask_spread_bps": 2,
                "volume_1h": 1_000_000,
                "open_interest": 8_000_000,
                "volatility_1h": 0.01,
                "volatility_24h": 0.04,
                "lend_apy": 0.08,
                "borrow_apy": 0.1,
                "utilization": 0.7,
                "estimated_execution_cost_bps": 5,
            }
        )
    return payload


class TestTrainingPipelineE2E(unittest.TestCase):
    def test_pipeline_outputs_artifacts(self) -> None:
        artifacts = run_training_pipeline(rows())
        self.assertIn("rmse", artifacts.edge_model_metrics)
        self.assertIn("risk_off_rate", artifacts.regime_metrics)
        self.assertIn("best_action", artifacts.rl_metrics)
        self.assertEqual(artifacts.registry_record["model_name"], "edge_model")
        self.assertIn("edge_model", artifacts.model_paths)


if __name__ == "__main__":
    unittest.main()
