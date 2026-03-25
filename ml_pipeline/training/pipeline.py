from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import json
from typing import Dict, List

from ml_pipeline.data import InMemoryDatasetStore, ingest_market_rows
from ml_pipeline.evaluation import InMemoryModelRegistry, evaluate_walk_forward
from ml_pipeline.features import build_features_and_labels
from ml_pipeline.models import EdgeModel, RegimeModel
from ml_pipeline.rl import SimplePolicyTrainer, TradingEnvironment


@dataclass
class TrainingArtifacts:
    edge_model_metrics: Dict[str, float]
    regime_metrics: Dict[str, float]
    rl_metrics: Dict[str, float]
    registry_record: Dict[str, str | float]
    model_paths: Dict[str, str]


def _split_train_validation(
    features: List[Dict[str, float | str]],
    labels: List[Dict[str, float | str]],
    validation_ratio: float,
) -> tuple[List[Dict[str, float | str]], List[Dict[str, float | str]], List[Dict[str, float | str]], List[Dict[str, float | str]]]:
    split_index = max(1, int(len(features) * (1 - validation_ratio)))
    train_features = features[:split_index]
    train_labels = labels[:split_index]
    val_features = features[split_index:] or features[-1:]
    val_labels = labels[split_index:] or labels[-1:]
    return train_features, train_labels, val_features, val_labels


def _regime_metrics(
    regime_model: RegimeModel,
    features: List[Dict[str, float | str]],
) -> Dict[str, float]:
    if not features:
        return {"risk_off_rate": 0.0, "stable_rate": 0.0}

    risk_off = 0
    stable = 0
    for feature in features:
        prediction = regime_model.predict(feature)
        if prediction["risk_off_probability"] >= prediction["stable_carry_probability"]:
            risk_off += 1
        else:
            stable += 1

    total = max(1, len(features))
    return {
        "risk_off_rate": risk_off / total,
        "stable_rate": stable / total,
    }


def _save_models(
    edge_model: EdgeModel,
    regime_model: RegimeModel,
    output_dir: Path,
) -> Dict[str, str]:
    output_dir.mkdir(parents=True, exist_ok=True)

    edge_path = output_dir / "edge_model.json"
    regime_path = output_dir / "regime_model.json"

    edge_path.write_text(json.dumps(edge_model.to_dict(), indent=2), encoding="utf-8")
    regime_path.write_text(json.dumps(regime_model.to_dict(), indent=2), encoding="utf-8")

    return {
        "edge_model": str(edge_path),
        "regime_model": str(regime_path),
    }


def run_training_pipeline(
    rows: List[Dict[str, float | str]],
    validation_ratio: float = 0.2,
    model_output_dir: str = "ml/models",
) -> TrainingArtifacts:
    store = InMemoryDatasetStore()
    ingest_market_rows(store, rows)

    batch = build_features_and_labels(store.all_rows())
    train_features, train_labels, val_features, val_labels = _split_train_validation(
        batch.features,
        batch.labels,
        validation_ratio,
    )

    edge_model = EdgeModel()
    edge_model.fit(train_features, train_labels)

    regime_model = RegimeModel()
    regime_model.fit(train_features, train_labels)

    walk_metrics = evaluate_walk_forward(batch.features, batch.labels, train_window=64, test_window=16)
    regime_metrics = _regime_metrics(regime_model, val_features)

    env = TradingEnvironment(val_features, val_labels)
    trainer = SimplePolicyTrainer(action_grid=[0.0, 0.2, 0.4, 0.6, 0.8, 1.0])
    rl_metrics = trainer.train(env, episodes=3)
    grid_metrics = trainer.train_grid_search(env, episodes=3)
    if grid_metrics["best_reward"] > rl_metrics["best_reward"]:
        rl_metrics = {
            **rl_metrics,
            "best_action": grid_metrics["best_action"],
            "best_reward": grid_metrics["best_reward"],
        }

    model_paths = _save_models(edge_model, regime_model, Path(model_output_dir))

    registry = InMemoryModelRegistry()
    record = registry.register(
        "edge_model",
        "v1",
        {
            "rmse": walk_metrics.get("rmse", 0.0),
            "best_reward": rl_metrics.get("best_reward", 0.0),
        },
    )

    return TrainingArtifacts(
        edge_model_metrics=walk_metrics,
        regime_metrics=regime_metrics,
        rl_metrics=rl_metrics,
        registry_record=record,
        model_paths=model_paths,
    )
