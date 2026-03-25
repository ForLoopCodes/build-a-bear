from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Iterable, List


REQUIRED_COLUMNS = [
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
]


def validate_row(row: Dict[str, float | str]) -> None:
    for key in REQUIRED_COLUMNS:
        if key not in row:
            raise ValueError(f"missing required column: {key}")

    utilization = float(row["utilization"])
    if utilization < 0 or utilization > 1:
        raise ValueError("utilization out of range")


@dataclass
class InMemoryDatasetStore:
    rows: List[Dict[str, float | str]] = field(default_factory=list)

    def insert_many(self, rows: Iterable[Dict[str, float | str]]) -> int:
        count = 0
        for row in rows:
            validate_row(row)
            self.rows.append(dict(row))
            count += 1
        return count

    def query_by_market(self, market: str) -> List[Dict[str, float | str]]:
        return [row for row in self.rows if row["market"] == market]

    def all_rows(self) -> List[Dict[str, float | str]]:
        return list(self.rows)
