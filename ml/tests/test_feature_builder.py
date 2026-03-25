import unittest

from ml_pipeline.features import build_features_and_labels


def make_row(ts: str, market: str, funding: float, basis: float) -> dict[str, float | str]:
    return {
        "timestamp": ts,
        "market": market,
        "funding_rate_hourly": funding,
        "basis_bps": basis,
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


class TestFeatureBuilder(unittest.TestCase):
    def test_builds_features_and_labels(self) -> None:
        rows = [
            make_row("2026-03-25T00:00:00Z", "BTC-PERP", 0.0001, 10),
            make_row("2026-03-25T01:00:00Z", "BTC-PERP", 0.00012, 11),
            make_row("2026-03-25T02:00:00Z", "BTC-PERP", 0.00015, 13),
            make_row("2026-03-25T03:00:00Z", "BTC-PERP", 0.00018, 15),
            make_row("2026-03-25T04:00:00Z", "BTC-PERP", 0.0002, 16),
        ]

        batch = build_features_and_labels(rows)
        self.assertEqual(len(batch.features), 5)
        self.assertEqual(len(batch.labels), 5)
        self.assertIn("funding_momentum_4h", batch.features[-1])
        self.assertIn("realized_next_4h_net_apy", batch.labels[-1])

    def test_supports_multiple_markets(self) -> None:
        rows = [
            make_row("2026-03-25T00:00:00Z", "BTC-PERP", 0.0001, 10),
            make_row("2026-03-25T00:00:00Z", "ETH-PERP", 0.0002, 20),
        ]

        batch = build_features_and_labels(rows)
        markets = {item["market"] for item in batch.features}
        self.assertEqual(markets, {"BTC-PERP", "ETH-PERP"})


if __name__ == "__main__":
    unittest.main()
