import unittest

from ml_pipeline.models import EdgeModel, RegimeModel


def feature(carry: float, vol24: float = 0.04, divergence: float = 5.0) -> dict[str, float | str]:
    return {
        "timestamp": "2026-03-25T00:00:00Z",
        "market": "BTC-PERP",
        "funding_momentum_4h": 0.00002,
        "basis_z_24h": 0.5,
        "spread_to_volatility": 0.02,
        "carry_edge_apy": carry,
        "mark_oracle_divergence_bps": divergence,
        "volatility_24h": vol24,
    }


def label(value: float) -> dict[str, float | str]:
    return {
        "timestamp": "2026-03-25T00:00:00Z",
        "market": "BTC-PERP",
        "realized_next_4h_net_apy": value,
    }


class TestSupervisedModels(unittest.TestCase):
    def test_edge_model_fit_and_predict(self) -> None:
        model = EdgeModel()
        features = [feature(0.10), feature(0.12), feature(0.15)]
        labels = [label(0.11), label(0.13), label(0.16)]
        model.fit(features, labels)

        prediction = model.predict(feature(0.14))
        self.assertIn("expected_net_apy", prediction)
        self.assertIn("confidence", prediction)
        self.assertGreater(prediction["confidence"], 0)

        payload = model.to_dict()
        restored = EdgeModel.from_dict(payload)
        restored_prediction = restored.predict(feature(0.14))
        self.assertIn("expected_net_apy", restored_prediction)

    def test_regime_model_risk_off(self) -> None:
        model = RegimeModel()
        output = model.predict(feature(0.1, vol24=0.09, divergence=10))
        self.assertGreater(output["risk_off_probability"], 0.6)

    def test_regime_model_stable(self) -> None:
        model = RegimeModel()
        model.fit([feature(0.1), feature(0.12, vol24=0.06), feature(0.08, vol24=0.03)], [])
        output = model.predict(feature(0.1, vol24=0.03, divergence=4))
        self.assertGreater(output["stable_carry_probability"], output["risk_off_probability"])

        payload = model.to_dict()
        restored = RegimeModel.from_dict(payload)
        output_restored = restored.predict(feature(0.1, vol24=0.03, divergence=4))
        self.assertIn("stable_carry_probability", output_restored)


if __name__ == "__main__":
    unittest.main()
