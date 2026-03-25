from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from typing import Dict, List


@dataclass
class FeatureLabelBatch:
    features: List[Dict[str, float | str]]
    labels: List[Dict[str, float | str]]


def _avg(values: List[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def _std(values: List[float]) -> float:
    if len(values) < 2:
        return 0.0
    mean = _avg(values)
    variance = _avg([(value - mean) ** 2 for value in values])
    return variance ** 0.5


def build_features_and_labels(rows: List[Dict[str, float | str]]) -> FeatureLabelBatch:
    grouped: Dict[str, List[Dict[str, float | str]]] = defaultdict(list)
    for row in rows:
        grouped[str(row["market"])].append(row)

    features: List[Dict[str, float | str]] = []
    labels: List[Dict[str, float | str]] = []

    for market, series in grouped.items():
        ordered = sorted(series, key=lambda item: str(item["timestamp"]))
        for index, row in enumerate(ordered):
            window_4h = ordered[max(0, index - 3):index + 1]
            window_24h = ordered[max(0, index - 23):index + 1]

            funding_values = [float(point["funding_rate_hourly"]) for point in window_4h]
            basis_values = [float(point["basis_bps"]) for point in window_24h]

            funding_momentum_4h = funding_values[-1] - funding_values[0] if len(funding_values) > 1 else 0.0
            basis_mean = _avg(basis_values)
            basis_std = _std(basis_values)
            basis_z_24h = (float(row["basis_bps"]) - basis_mean) / (basis_std if basis_std > 1e-9 else 1e-9)

            spread_to_volatility = float(row["bid_ask_spread_bps"]) / max(float(row["volatility_1h"]) * 10_000, 1e-9)
            carry_edge_apy = (
                float(row["lend_apy"]) + float(row["funding_rate_hourly"]) * 24 * 365.25 - float(row["borrow_apy"])
            )

            features.append(
                {
                    "timestamp": str(row["timestamp"]),
                    "market": market,
                    "funding_momentum_4h": funding_momentum_4h,
                    "basis_z_24h": basis_z_24h,
                    "spread_to_volatility": spread_to_volatility,
                    "carry_edge_apy": carry_edge_apy,
                    "mark_oracle_divergence_bps": float(row["mark_oracle_divergence_bps"]),
                    "volatility_24h": float(row["volatility_24h"]),
                }
            )

            next_index = min(index + 4, len(ordered) - 1)
            next_row = ordered[next_index]
            realized_next_4h_net_apy = (
                float(next_row["lend_apy"]) + float(next_row["funding_rate_hourly"]) * 24 * 365.25 - float(next_row["borrow_apy"])
            )

            labels.append(
                {
                    "timestamp": str(row["timestamp"]),
                    "market": market,
                    "realized_next_4h_net_apy": realized_next_4h_net_apy,
                }
            )

    return FeatureLabelBatch(features=features, labels=labels)
