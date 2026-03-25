from __future__ import annotations

import argparse
import json
from pathlib import Path

from ml_pipeline.data import (
    BinanceDatasetConfig,
    BinanceHistoricalDataClient,
    HistoricalDataPlan,
    generate_synthetic_historical_rows,
)
from ml_pipeline.training.pipeline import run_training_pipeline


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run production-grade ML training workflow")
    parser.add_argument("--years", type=int, default=4)
    parser.add_argument("--interval-hours", type=int, default=1)
    parser.add_argument("--markets", type=str, default="BTC-PERP,ETH-PERP,SOL-PERP")
    parser.add_argument("--output", type=str, default="ml/output")
    parser.add_argument("--validation-ratio", type=float, default=0.2)
    parser.add_argument("--data-source", type=str, default="binance", choices=["binance", "synthetic"])
    parser.add_argument("--cache-path", type=str, default="ml/data/cache/binance_history.jsonl")
    parser.add_argument("--force-refresh", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    markets = [market.strip() for market in args.markets.split(",") if market.strip()]
    years = max(1, args.years)
    interval_hours = max(1, args.interval_hours)

    if args.data_source == "binance":
        client = BinanceHistoricalDataClient()
        rows = client.fetch_dataset(
            BinanceDatasetConfig(
                markets=markets,
                years=years,
                interval_hours=interval_hours,
                cache_path=args.cache_path,
                use_cache=not args.force_refresh,
            )
        )
        if not rows:
            plan = HistoricalDataPlan(markets=markets, years=years, interval_hours=interval_hours)
            rows = generate_synthetic_historical_rows(plan)
    else:
        plan = HistoricalDataPlan(markets=markets, years=years, interval_hours=interval_hours)
        rows = generate_synthetic_historical_rows(plan)

    artifacts = run_training_pipeline(
        rows=rows,
        validation_ratio=args.validation_ratio,
        model_output_dir=str(output_dir / "models"),
    )

    summary = {
        "data": {
            "rows": len(rows),
            "markets": markets,
            "years": years,
            "interval_hours": interval_hours,
            "data_source": args.data_source,
            "cache_path": args.cache_path,
        },
        "edge_metrics": artifacts.edge_model_metrics,
        "regime_metrics": artifacts.regime_metrics,
        "rl_metrics": artifacts.rl_metrics,
        "registry_record": artifacts.registry_record,
        "model_paths": artifacts.model_paths,
    }

    summary_path = output_dir / "training_summary.json"
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    print("training_summary", summary_path)
    print("rows", len(rows))
    print("edge_rmse", artifacts.edge_model_metrics.get("rmse"))
    print("rl_best_reward", artifacts.rl_metrics.get("best_reward"))
    print("models", artifacts.model_paths)


if __name__ == "__main__":
    main()
