from __future__ import annotations

from typing import Dict, Iterable, List

from .storage import InMemoryDatasetStore


def ingest_market_rows(
    store: InMemoryDatasetStore,
    payload_rows: Iterable[Dict[str, float | str]],
) -> int:
    normalized_rows: List[Dict[str, float | str]] = []
    for row in payload_rows:
        for key in (
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
        ):
            if key not in row:
                raise ValueError(f"missing required column: {key}")

        normalized_rows.append(
            {
                "timestamp": str(row["timestamp"]),
                "market": str(row["market"]),
                "funding_rate_hourly": float(row["funding_rate_hourly"]),
                "basis_bps": float(row["basis_bps"]),
                "mark_oracle_divergence_bps": float(row["mark_oracle_divergence_bps"]),
                "bid_ask_spread_bps": float(row["bid_ask_spread_bps"]),
                "volume_1h": float(row["volume_1h"]),
                "open_interest": float(row["open_interest"]),
                "volatility_1h": float(row["volatility_1h"]),
                "volatility_24h": float(row["volatility_24h"]),
                "lend_apy": float(row["lend_apy"]),
                "borrow_apy": float(row["borrow_apy"]),
                "utilization": float(row["utilization"]),
                "estimated_execution_cost_bps": float(row["estimated_execution_cost_bps"]),
            }
        )

    return store.insert_many(normalized_rows)
