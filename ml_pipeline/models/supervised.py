from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List


@dataclass
class EdgeModel:
    bias: float = 0.0
    weight_carry_edge: float = 1.0
    weight_funding_momentum: float = 0.4
    weight_basis_z: float = 0.15
    weight_spread_penalty: float = 0.2

    def fit(self, features: List[Dict[str, float | str]], labels: List[Dict[str, float | str]]) -> None:
        if not features or not labels:
            self.bias = 0.0
            return

        mean_label = sum(float(item["realized_next_4h_net_apy"]) for item in labels) / len(labels)
        mean_feature = sum(float(item["carry_edge_apy"]) for item in features) / len(features)
        self.bias = mean_label - self.weight_carry_edge * mean_feature

    def predict(self, feature: Dict[str, float | str]) -> Dict[str, float]:
        score = (
            self.bias
            + self.weight_carry_edge * float(feature["carry_edge_apy"])
            + self.weight_funding_momentum * float(feature["funding_momentum_4h"])
            + self.weight_basis_z * float(feature["basis_z_24h"]) * 0.01
            - self.weight_spread_penalty * float(feature["spread_to_volatility"])
        )
        confidence = max(0.1, min(0.95, 1 - float(feature["mark_oracle_divergence_bps"]) / 100))
        return {"expected_net_apy": score, "confidence": confidence}


@dataclass
class RegimeModel:
    risk_off_vol_threshold: float = 0.08
    unstable_vol_threshold: float = 0.05
    risk_off_divergence_threshold: float = 30.0

    def fit(self, _: List[Dict[str, float | str]], __: List[Dict[str, float | str]]) -> None:
        return

    def predict(self, feature: Dict[str, float | str]) -> Dict[str, float]:
        volatility = float(feature["volatility_24h"])
        divergence = float(feature["mark_oracle_divergence_bps"])

        if volatility >= self.risk_off_vol_threshold or divergence >= self.risk_off_divergence_threshold:
            return {
                "stable_carry_probability": 0.1,
                "unstable_carry_probability": 0.2,
                "risk_off_probability": 0.7,
            }

        if volatility >= self.unstable_vol_threshold:
            return {
                "stable_carry_probability": 0.2,
                "unstable_carry_probability": 0.65,
                "risk_off_probability": 0.15,
            }

        return {
            "stable_carry_probability": 0.7,
            "unstable_carry_probability": 0.2,
            "risk_off_probability": 0.1,
        }
