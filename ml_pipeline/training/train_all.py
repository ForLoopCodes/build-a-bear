from .pipeline import run_training_pipeline


def sample_rows() -> list[dict[str, float | str]]:
    rows: list[dict[str, float | str]] = []
    for index in range(12):
        rows.append(
            {
                "timestamp": f"2026-03-25T{index:02d}:00:00Z",
                "market": "BTC-PERP",
                "funding_rate_hourly": 0.0001 + index * 0.000005,
                "basis_bps": 10 + index,
                "mark_oracle_divergence_bps": 4 + (index % 3),
                "bid_ask_spread_bps": 2,
                "volume_1h": 1_000_000 + index * 1000,
                "open_interest": 8_000_000 + index * 5000,
                "volatility_1h": 0.01,
                "volatility_24h": 0.04,
                "lend_apy": 0.08,
                "borrow_apy": 0.1,
                "utilization": 0.7,
                "estimated_execution_cost_bps": 5,
            }
        )
    return rows


def main() -> None:
    artifacts = run_training_pipeline(sample_rows())
    print("edge_metrics", artifacts.edge_model_metrics)
    print("rl_metrics", artifacts.rl_metrics)
    print("registry_record", artifacts.registry_record)


if __name__ == "__main__":
    main()
