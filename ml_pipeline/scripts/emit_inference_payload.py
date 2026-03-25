from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict

from ml_pipeline.models import EdgeModel, RegimeModel


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate bot-ready ML inference payload")
    parser.add_argument("--models-dir", type=str, default="ml/output/models")
    parser.add_argument("--output", type=str, default="ml/output/inference_payload.json")
    return parser.parse_args()


def load_json(path: Path) -> Dict[str, object]:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> None:
    args = parse_args()
    models_dir = Path(args.models_dir)
    edge_model = EdgeModel.from_dict(load_json(models_dir / "edge_model.json"))
    regime_model = RegimeModel.from_dict(load_json(models_dir / "regime_model.json"))

    sample_features = [
        {
            "timestamp": "2026-03-25T00:00:00Z",
            "market": "BTC-PERP",
            "funding_momentum_4h": 0.00002,
            "basis_z_24h": 0.3,
            "spread_to_volatility": 0.02,
            "carry_edge_apy": 0.13,
            "mark_oracle_divergence_bps": 5,
            "volatility_24h": 0.045,
        },
        {
            "timestamp": "2026-03-25T00:00:00Z",
            "market": "ETH-PERP",
            "funding_momentum_4h": 0.00003,
            "basis_z_24h": 0.4,
            "spread_to_volatility": 0.025,
            "carry_edge_apy": 0.14,
            "mark_oracle_divergence_bps": 6,
            "volatility_24h": 0.05,
        },
        {
            "timestamp": "2026-03-25T00:00:00Z",
            "market": "SOL-PERP",
            "funding_momentum_4h": 0.00004,
            "basis_z_24h": 0.6,
            "spread_to_volatility": 0.03,
            "carry_edge_apy": 0.16,
            "mark_oracle_divergence_bps": 8,
            "volatility_24h": 0.06,
        },
    ]

    edge_predictions = []
    regime_predictions = []
    for feature in sample_features:
        edge = edge_model.predict(feature)
        regime = regime_model.predict(feature)
        edge_predictions.append(
            {
                "market": feature["market"],
                "expected_net_apy": edge["expected_net_apy"],
                "confidence": edge["confidence"],
            }
        )
        regime_predictions.append(regime)

    avg_regime = {
        "stable_carry_probability": sum(item["stable_carry_probability"] for item in regime_predictions)
        / len(regime_predictions),
        "unstable_carry_probability": sum(item["unstable_carry_probability"] for item in regime_predictions)
        / len(regime_predictions),
        "risk_off_probability": sum(item["risk_off_probability"] for item in regime_predictions)
        / len(regime_predictions),
    }

    payload = {
        "edge_predictions": edge_predictions,
        "regime_prediction": avg_regime,
    }

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print("inference_payload", output_path)


if __name__ == "__main__":
    main()
