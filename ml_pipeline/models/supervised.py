from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Sequence

import numpy as np


@dataclass
class EdgeModel:
    ridge_lambda: float = 1e-2
    weights: List[float] | None = None
    residual_std: float = 0.05
    feature_mean: List[float] | None = None
    feature_std: List[float] | None = None

    def _raw_vector(self, feature: Dict[str, float | str]) -> np.ndarray:
        return np.array(
            [
                float(feature["carry_edge_apy"]),
                float(feature["funding_momentum_4h"]),
                float(feature["basis_z_24h"]),
                float(feature["spread_to_volatility"]),
                float(feature["mark_oracle_divergence_bps"]) / 100.0,
                float(feature["volatility_24h"]),
            ],
            dtype=float,
        )

    def _design_matrix(self, features: List[Dict[str, float | str]]) -> np.ndarray:
        raw = np.vstack([self._raw_vector(feature) for feature in features])
        if self.feature_mean is None or self.feature_std is None:
            self.feature_mean = raw.mean(axis=0).tolist()
            std = raw.std(axis=0)
            std = np.where(std < 1e-9, 1.0, std)
            self.feature_std = std.tolist()

        means = np.array(self.feature_mean, dtype=float)
        stds = np.array(self.feature_std, dtype=float)
        normalized = (raw - means) / stds
        intercept = np.ones((normalized.shape[0], 1), dtype=float)
        return np.hstack([intercept, normalized])

    def _single_design(self, feature: Dict[str, float | str]) -> np.ndarray:
        raw = self._raw_vector(feature)
        means = np.array(self.feature_mean if self.feature_mean is not None else [0.0] * len(raw), dtype=float)
        stds = np.array(self.feature_std if self.feature_std is not None else [1.0] * len(raw), dtype=float)
        normalized = (raw - means) / stds
        return np.concatenate([np.array([1.0], dtype=float), normalized])

    def fit(self, features: List[Dict[str, float | str]], labels: List[Dict[str, float | str]]) -> None:
        if not features or not labels:
            self.weights = [0.0] * 7
            self.residual_std = 0.05
            self.feature_mean = [0.0] * 6
            self.feature_std = [1.0] * 6
            return

        design = self._design_matrix(features)
        targets = np.array([float(item["realized_next_4h_net_apy"]) for item in labels], dtype=float)
        targets = np.clip(targets, -1.5, 2.5)
        regularizer = self.ridge_lambda * np.eye(design.shape[1])
        solved = np.linalg.solve(design.T @ design + regularizer, design.T @ targets)
        self.weights = solved.tolist()

        predictions = design @ solved
        residuals = targets - predictions
        self.residual_std = float(np.std(residuals)) if len(residuals) else 0.05
        if self.residual_std < 1e-6:
            self.residual_std = 1e-6

    def predict(self, feature: Dict[str, float | str]) -> Dict[str, float]:
        vector = self._single_design(feature)
        model_weights = np.array(self.weights if self.weights is not None else [0.0] * 7, dtype=float)
        score = float(vector @ model_weights)
        score = float(np.clip(score, -2.0, 3.0))

        divergence_penalty = float(feature["mark_oracle_divergence_bps"]) / 120.0
        volatility_penalty = float(feature["volatility_24h"]) * 1.8
        uncertainty_penalty = min(0.7, self.residual_std * 4)
        confidence = max(0.05, min(0.98, 1 - divergence_penalty - volatility_penalty - uncertainty_penalty))
        return {"expected_net_apy": score, "confidence": confidence}

    def to_dict(self) -> Dict[str, object]:
        return {
            "ridge_lambda": self.ridge_lambda,
            "weights": self.weights if self.weights is not None else [0.0] * 7,
            "residual_std": self.residual_std,
            "feature_mean": self.feature_mean if self.feature_mean is not None else [0.0] * 6,
            "feature_std": self.feature_std if self.feature_std is not None else [1.0] * 6,
        }

    @staticmethod
    def _float_value(payload: Dict[str, object], key: str, default: float) -> float:
        value = payload.get(key, default)
        if isinstance(value, (int, float)):
            return float(value)
        return default

    @staticmethod
    def _list_value(
        payload: Dict[str, object],
        key: str,
        default: Sequence[float],
    ) -> List[float]:
        value = payload.get(key, default)
        if isinstance(value, list):
            return [float(item) for item in value if isinstance(item, (int, float))]
        return [float(item) for item in default]

    @classmethod
    def from_dict(cls, payload: Dict[str, object]) -> "EdgeModel":
        return cls(
            ridge_lambda=cls._float_value(payload, "ridge_lambda", 1e-2),
            weights=cls._list_value(payload, "weights", [0.0] * 7),
            residual_std=cls._float_value(payload, "residual_std", 0.05),
            feature_mean=cls._list_value(payload, "feature_mean", [0.0] * 6),
            feature_std=cls._list_value(payload, "feature_std", [1.0] * 6),
        )


@dataclass
class RegimeModel:
    risk_off_vol_threshold: float = 0.08
    unstable_vol_threshold: float = 0.05
    risk_off_divergence_threshold: float = 30.0

    def fit(self, features: List[Dict[str, float | str]], _: List[Dict[str, float | str]]) -> None:
        if not features:
            return

        vols = np.array([float(feature["volatility_24h"]) for feature in features], dtype=float)
        divergences = np.array([float(feature["mark_oracle_divergence_bps"]) for feature in features], dtype=float)

        self.unstable_vol_threshold = float(np.quantile(vols, 0.6))
        self.risk_off_vol_threshold = float(np.quantile(vols, 0.85))
        self.risk_off_divergence_threshold = float(np.quantile(divergences, 0.8))

        if self.unstable_vol_threshold > self.risk_off_vol_threshold:
            self.unstable_vol_threshold = self.risk_off_vol_threshold * 0.8

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

    def to_dict(self) -> Dict[str, float]:
        return {
            "risk_off_vol_threshold": self.risk_off_vol_threshold,
            "unstable_vol_threshold": self.unstable_vol_threshold,
            "risk_off_divergence_threshold": self.risk_off_divergence_threshold,
        }

    @classmethod
    def from_dict(cls, payload: Dict[str, object]) -> "RegimeModel":
        risk_off = payload.get("risk_off_vol_threshold", 0.08)
        unstable = payload.get("unstable_vol_threshold", 0.05)
        divergence = payload.get("risk_off_divergence_threshold", 30.0)
        return cls(
            risk_off_vol_threshold=float(risk_off) if isinstance(risk_off, (int, float)) else 0.08,
            unstable_vol_threshold=float(unstable) if isinstance(unstable, (int, float)) else 0.05,
            risk_off_divergence_threshold=float(divergence)
            if isinstance(divergence, (int, float))
            else 30.0,
        )
