from ml_pipeline.data import BinanceDatasetConfig, BinanceHistoricalDataClient
from .pipeline import run_training_pipeline


def sample_rows() -> list[dict[str, float | str]]:
    client = BinanceHistoricalDataClient()
    return client.fetch_dataset(
        BinanceDatasetConfig(
            markets=["BTC-PERP", "ETH-PERP", "SOL-PERP"],
            years=3,
            interval_hours=1,
            cache_path="ml/data/cache/binance_history_3y.jsonl",
            use_cache=True,
        )
    )


def main() -> None:
    artifacts = run_training_pipeline(
        sample_rows(),
        validation_ratio=0.2,
        model_output_dir="ml/output/models",
    )
    print("edge_metrics", artifacts.edge_model_metrics)
    print("regime_metrics", artifacts.regime_metrics)
    print("rl_metrics", artifacts.rl_metrics)
    print("registry_record", artifacts.registry_record)
    print("model_paths", artifacts.model_paths)


if __name__ == "__main__":
    main()
