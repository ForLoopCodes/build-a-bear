from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List

from ml_pipeline.data import InMemoryDatasetStore, ingest_market_rows
from ml_pipeline.evaluation import InMemoryModelRegistry, evaluate_walk_forward
from ml_pipeline.features import build_features_and_labels
from ml_pipeline.models import EdgeModel, RegimeModel
from ml_pipeline.rl import SimplePolicyTrainer, TradingEnvironment


@dataclass
class TrainingArtifacts:
    edge_model_metrics: Dict[str, float]
    rl_metrics: Dict[str, float]
    registry_record: Dict[str, str | float]


def run_training_pipeline(rows: List[Dict[str, float | str]]) -> TrainingArtifacts:
    store = InMemoryDatasetStore()
    ingest_market_rows(store, rows)

    batch = build_features_and_labels(store.all_rows())

    edge_model = EdgeModel()
    edge_model.fit(batch.features, batch.labels)

    regime_model = RegimeModel()
    regime_model.fit(batch.features, batch.labels)

    walk_metrics = evaluate_walk_forward(batch.features, batch.labels, train_window=4, test_window=2)

    env = TradingEnvironment(batch.features, batch.labels)
    trainer = SimplePolicyTrainer(action_grid=[0.0, 0.25, 0.5, 0.75, 1.0])
    rl_metrics = trainer.train(env, episodes=3)

    registry = InMemoryModelRegistry()
    record = registry.register("edge_model", "v1", {"rmse": walk_metrics.get("rmse", 0.0)})

    return TrainingArtifacts(
        edge_model_metrics=walk_metrics,
        rl_metrics=rl_metrics,
        registry_record=record,
    )
