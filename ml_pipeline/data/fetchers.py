from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List

import numpy as np


@dataclass
class HistoricalDataPlan:
    markets: List[str]
    years: int
    interval_hours: int


def _iso_at(base: datetime, offset_hours: int) -> str:
    return (base + timedelta(hours=offset_hours)).replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")


def generate_synthetic_historical_rows(plan: HistoricalDataPlan, seed: int = 42) -> List[Dict[str, float | str]]:
    rng = np.random.default_rng(seed)
    total_hours = max(24, int(365.25 * 24 * plan.years))
    step = max(1, plan.interval_hours)
    count = total_hours // step
    start = datetime.now(timezone.utc) - timedelta(hours=total_hours)

    rows: List[Dict[str, float | str]] = []
    market_bias = {
        "BTC-PERP": 0.00008,
        "ETH-PERP": 0.0001,
        "SOL-PERP": 0.00012,
    }

    for market in plan.markets:
        funding = market_bias.get(market, 0.00009)
        basis = 10.0
        volatility = 0.04
        for index in range(count):
            funding += rng.normal(0, 0.000005)
            basis += rng.normal(0, 0.8)
            volatility = max(0.01, volatility + rng.normal(0, 0.002))

            row = {
                "timestamp": _iso_at(start, index * step),
                "market": market,
                "funding_rate_hourly": float(np.clip(funding, -0.0004, 0.0006)),
                "basis_bps": float(np.clip(basis, -60, 120)),
                "mark_oracle_divergence_bps": float(np.clip(abs(rng.normal(5, 3)), 0, 40)),
                "bid_ask_spread_bps": float(np.clip(abs(rng.normal(2.5, 1.2)), 0.5, 12)),
                "volume_1h": float(np.clip(rng.normal(8_000_000, 1_500_000), 500_000, 50_000_000)),
                "open_interest": float(np.clip(rng.normal(20_000_000, 5_000_000), 1_000_000, 100_000_000)),
                "volatility_1h": float(np.clip(volatility * 0.25 + abs(rng.normal(0, 0.004)), 0.002, 0.08)),
                "volatility_24h": float(np.clip(volatility, 0.01, 0.2)),
                "lend_apy": float(np.clip(rng.normal(0.075, 0.01), 0.02, 0.18)),
                "borrow_apy": float(np.clip(rng.normal(0.11, 0.015), 0.03, 0.25)),
                "utilization": float(np.clip(rng.normal(0.72, 0.1), 0.2, 0.98)),
                "estimated_execution_cost_bps": float(np.clip(rng.normal(5, 2), 1, 30)),
            }
            rows.append(row)

    return rows


def save_rows_to_jsonl(rows: List[Dict[str, float | str]], target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open("w", encoding="utf-8") as file:
        for row in rows:
            line = "{" + ",".join([f'"{key}":"{value}"' if isinstance(value, str) else f'"{key}":{value}' for key, value in row.items()]) + "}"
            file.write(line + "\n")
