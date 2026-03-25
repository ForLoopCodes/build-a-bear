import unittest

from ml_pipeline.data import InMemoryDatasetStore, ingest_market_rows


def sample_row(market: str = "BTC-PERP") -> dict[str, float | str]:
    return {
        "timestamp": "2026-03-25T00:00:00Z",
        "market": market,
        "funding_rate_hourly": 0.0001,
        "basis_bps": 12,
        "mark_oracle_divergence_bps": 4,
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


class TestDataIngestion(unittest.TestCase):
    def test_ingest_rows(self) -> None:
        store = InMemoryDatasetStore()
        count = ingest_market_rows(store, [sample_row(), sample_row("ETH-PERP")])
        self.assertEqual(count, 2)
        self.assertEqual(len(store.query_by_market("BTC-PERP")), 1)
        self.assertEqual(len(store.query_by_market("ETH-PERP")), 1)

    def test_invalid_row_rejected(self) -> None:
        store = InMemoryDatasetStore()
        bad = sample_row()
        bad.pop("market")
        with self.assertRaises(ValueError):
            ingest_market_rows(store, [bad])

    def test_invalid_utilization_rejected(self) -> None:
        store = InMemoryDatasetStore()
        bad = sample_row()
        bad["utilization"] = 1.5
        with self.assertRaises(ValueError):
            ingest_market_rows(store, [bad])


if __name__ == "__main__":
    unittest.main()
