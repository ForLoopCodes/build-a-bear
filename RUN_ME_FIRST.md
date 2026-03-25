This guide gives one-command training and model output for hackathon users.
It runs end-to-end ML pipeline, model export, and bot inference payload.

# One Command Setup

Run this command from the repository root:

```bash
npm run ml:production
```

On Windows, you can also double-click:

`scripts/run_hackathon_pipeline.bat`

## What It Does

- Downloads and builds years of market history for `BTC-PERP`, `ETH-PERP`, `SOL-PERP`.
- Trains supervised edge and regime models.
- Trains RL policy and chooses higher reward policy output.
- Runs walk-forward evaluation and records metrics.
- Exports model files and an inference payload for bot integration.

## Output Files

- `ml/output/training_summary.json`
- `ml/output/models/edge_model.json`
- `ml/output/models/regime_model.json`
- `ml/output/inference_payload.json`
- Cached history at `ml/data/cache/binance_history_5y.jsonl`

## For Real Data

Default pipeline uses Binance historical market endpoints for futures and spot.
If endpoint errors occur, switch to synthetic fallback by running:

```bash
python -m ml_pipeline.scripts.run_production_training --data-source synthetic --years 5 --output ml/output
```
