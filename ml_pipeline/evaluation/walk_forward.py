from __future__ import annotations

from typing import Dict, List

from ml_pipeline.models import EdgeModel


def evaluate_walk_forward(
    features: List[Dict[str, float | str]],
    labels: List[Dict[str, float | str]],
    train_window: int,
    test_window: int,
) -> Dict[str, float]:
    if len(features) != len(labels):
        raise ValueError("features and labels length mismatch")
    if train_window <= 0 or test_window <= 0:
        raise ValueError("train and test windows must be positive")

    model = EdgeModel()
    mse_values: List[float] = []
    index = train_window

    while index + test_window <= len(features):
        train_features = features[index - train_window:index]
        train_labels = labels[index - train_window:index]
        test_features = features[index:index + test_window]
        test_labels = labels[index:index + test_window]

        model.fit(train_features, train_labels)

        for feature, label in zip(test_features, test_labels):
            prediction = model.predict(feature)
            target = float(label["realized_next_4h_net_apy"])
            error = prediction["expected_net_apy"] - target
            mse_values.append(error * error)

        index += test_window

    if not mse_values:
        return {"mse": 0.0, "rmse": 0.0, "num_predictions": 0}

    mse = sum(mse_values) / len(mse_values)
    rmse = mse ** 0.5
    return {
        "mse": mse,
        "rmse": rmse,
        "num_predictions": float(len(mse_values)),
    }
