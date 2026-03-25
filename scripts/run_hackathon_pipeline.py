from __future__ import annotations

import json
import subprocess
from pathlib import Path


def run(command: list[str]) -> None:
    subprocess.run(command, check=True)


def main() -> None:
    run([
        "python",
        "-m",
        "ml_pipeline.scripts.run_production_training",
        "--data-source",
        "binance",
        "--years",
        "5",
        "--interval-hours",
        "1",
        "--markets",
        "BTC-PERP,ETH-PERP,SOL-PERP",
        "--cache-path",
        "ml/data/cache/binance_history_5y.jsonl",
        "--output",
        "ml/output",
        "--validation-ratio",
        "0.2",
    ])

    run([
        "python",
        "-m",
        "ml_pipeline.scripts.emit_inference_payload",
        "--models-dir",
        "ml/output/models",
        "--output",
        "ml/output/inference_payload.json",
    ])

    summary_path = Path("ml/output/training_summary.json")
    payload_path = Path("ml/output/inference_payload.json")

    summary = json.loads(summary_path.read_text(encoding="utf-8"))
    payload = json.loads(payload_path.read_text(encoding="utf-8"))

    print("hackathon_pipeline_complete")
    print("summary", summary_path)
    print("payload", payload_path)
    print("rows", summary["data"]["rows"])
    print("edge_rmse", summary["edge_metrics"]["rmse"])
    print("rl_best_reward", summary["rl_metrics"]["best_reward"])
    print("top_market", payload["edge_predictions"][0]["market"])


if __name__ == "__main__":
    main()
