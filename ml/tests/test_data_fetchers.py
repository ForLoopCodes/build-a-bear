import unittest

from ml_pipeline.data import HistoricalDataPlan, generate_synthetic_historical_rows


class TestDataFetchers(unittest.TestCase):
    def test_generates_years_of_rows(self) -> None:
        plan = HistoricalDataPlan(markets=["BTC-PERP", "ETH-PERP"], years=2, interval_hours=2)
        rows = generate_synthetic_historical_rows(plan, seed=123)
        self.assertGreater(len(rows), 1000)
        self.assertEqual({row["market"] for row in rows}, {"BTC-PERP", "ETH-PERP"})

    def test_generated_rows_have_required_fields(self) -> None:
        plan = HistoricalDataPlan(markets=["SOL-PERP"], years=1, interval_hours=6)
        rows = generate_synthetic_historical_rows(plan, seed=7)
        required = {
            "timestamp",
            "market",
            "funding_rate_hourly",
            "basis_bps",
            "mark_oracle_divergence_bps",
            "bid_ask_spread_bps",
            "volume_1h",
            "open_interest",
            "volatility_1h",
            "volatility_24h",
            "lend_apy",
            "borrow_apy",
            "utilization",
            "estimated_execution_cost_bps",
        }
        self.assertTrue(required.issubset(rows[0].keys()))


if __name__ == "__main__":
    unittest.main()
