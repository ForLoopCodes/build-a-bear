import unittest
from datetime import datetime, timezone

from ml_pipeline.data.binance_history import assemble_rows_from_market_series


def ts(hours: int) -> int:
    start = int(datetime(2024, 1, 1, tzinfo=timezone.utc).timestamp() * 1000)
    return start + hours * 60 * 60 * 1000


def candle(timestamp: int, open_price: float, high: float, low: float, close: float, quote_volume: float) -> list[object]:
    return [timestamp, str(open_price), str(high), str(low), str(close), "0", timestamp + 3599999, str(quote_volume)]


class TestBinanceHistoryAssembler(unittest.TestCase):
    def test_assemble_rows(self) -> None:
        futures = [
            candle(ts(0), 100, 101, 99, 100.5, 1_000_000),
            candle(ts(1), 100.5, 102, 100, 101.2, 1_100_000),
            candle(ts(2), 101.2, 103, 101, 102.4, 1_200_000),
        ]
        spot = [
            candle(ts(0), 100, 100.8, 99.5, 100.1, 900_000),
            candle(ts(1), 100.1, 101.6, 99.9, 100.9, 950_000),
            candle(ts(2), 100.9, 102.4, 100.6, 101.8, 980_000),
        ]
        funding = [
            {"fundingTime": ts(0), "fundingRate": 0.0002},
            {"fundingTime": ts(2), "fundingRate": 0.0001},
        ]
        oi = [
            {"timestamp": ts(0), "sumOpenInterestValue": 20_000_000},
            {"timestamp": ts(2), "sumOpenInterestValue": 21_000_000},
        ]

        rows = assemble_rows_from_market_series("BTC-PERP", futures, spot, funding, oi)
        self.assertEqual(len(rows), 3)
        self.assertIn("funding_rate_hourly", rows[0])
        self.assertIn("basis_bps", rows[0])
        self.assertEqual(rows[0]["market"], "BTC-PERP")


if __name__ == "__main__":
    unittest.main()
