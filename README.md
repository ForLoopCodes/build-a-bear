This repository contains production-oriented ML and bot runtime for Drift vaults.
It provides one-command training, inference payload export, and devnet paper trading.

# Build-A-Bear Drift Strategy System

## What This Repository Delivers

- End-to-end historical training pipeline over years of market data.
- Live-ready signal pipeline with ML payload ingestion and online calibration.
- Risk-constrained strategy execution for drift-side-track-compatible carry logic.
- Solana Devnet paper-trading runner connected to your wallet balance.

## One Command Commands

- Train and export full ML artifacts:

```bash
npm run ml:production
```

- Run devnet wallet-connected paper trading cycle:

```bash
npm run bot:devnet:paper
```

## Frontend Control Plane

You now have a minimal wallet-connected frontend and API service.

- Start API:

```bash
npm run api:dev
```

- Start frontend:

```bash
npm run web:dev
```

- Build both for deployment:

```bash
npm run app:build
```

Frontend features:

- Connect Phantom wallet.
- Send SOL from user wallet to bot wallet.
- Record funding deposits and allocation allowance.
- Run training and strategy cycle controls.
- See real-time PnL, claimable balance, and ledgers.
- Trigger claim payout from bot wallet to user wallet.

## API Runtime Endpoints

- `GET /api/status`
- `POST /api/deposits/record`
- `POST /api/automation/toggle`
- `POST /api/automation/run-cycle`
- `POST /api/training/run`
- `POST /api/claims/claim`

## Environment For API and Bot

- `BOT_AUTHORITY_KEYPAIR_PATH` or `BOT_KEYPAIR_PATH` is optional for explicit authority key selection.
- If no authority key path is provided, bot authority is auto-generated at `ml/output/bot_authority_keypair.json`.
- `RPC_URL` optional, defaults to devnet where applicable.
- `API_PORT` optional, default `8787`.

## Security Notes

- Current claim endpoint trusts API caller wallet field; add signature challenge verification before public deployment.
- Keep bot keypair outside repository and use secure secret management in production.
- Devnet runner is paper strategy logic and payout movement tool, not direct on-chain Drift order execution.

## Required Environment Variables

- No required wallet key env var for local runs; authority key is generated automatically when missing.
- `BOT_AUTHORITY_KEYPAIR_PATH`: optional absolute or repo-relative path for persisted bot authority.
- `RPC_URL`: optional, defaults to devnet cluster in paper-runner.
- `ML_PAYLOAD_PATH`: optional, defaults to `ml/output/inference_payload.json`.
- `PAPER_OUTPUT_PATH`: optional, defaults to `ml/output/devnet_paper_run.json`.

## Core Architecture

## Historical Data and Training

- Real historical ingestion from Binance futures and spot endpoints in `ml_pipeline/data/binance_history.py:1`.
- Feature and label generation in `ml_pipeline/features/builder.py:1`.
- Supervised models with normalization and serialization in `ml_pipeline/models/supervised.py:1`.
- RL environment and policy trainer in `ml_pipeline/rl/environment.py:1` and `ml_pipeline/rl/trainer.py:1`.
- Walk-forward evaluation and model registry in `ml_pipeline/evaluation/walk_forward.py:1` and `ml_pipeline/evaluation/registry.py:1`.
- Production training command surface in `ml_pipeline/scripts/run_production_training.py:1`.

## Runtime and Bot Execution

- Strategy orchestration loop in `apps/bot/src/runtime/orchestrator.ts:1`.
- Risk authority engine in `apps/bot/src/risk/policy.ts:1`.
- Regime and state transitions in `apps/bot/src/strategy/router.ts:1`.
- Allocation and rebalance planning in `apps/bot/src/allocation/sizer.ts:1` and `apps/bot/src/rebalance/planner.ts:1`.
- Execution simulator and KPI reporting in `apps/bot/src/execution/simulator.ts:1` and `apps/bot/src/reporting/kpi.ts:1`.

## Live and Devnet Integration

- Live market snapshots from Binance in `apps/bot/src/live/binance_live_source.ts:1`.
- ML payload integration in `apps/bot/src/live/ml_signals.ts:1`.
- Online confidence/edge calibrator in `apps/bot/src/live/online_calibrator.ts:1`.
- Devnet wallet and SOL balance in `apps/bot/src/live/devnet_wallet.ts:1`.
- Devnet paper trading cycle in `apps/bot/src/live/devnet_paper_runner.ts:1`.

## Real-Time Learning Design

Real-time learning is handled through online posterior-style calibration:

- Load previous calibration state from `ml/output/online_calibrator.json`.
- Calibrate current ML edge/confidence before allocation.
- Update calibration after realized paper result each run.
- Persist new state and append run traces to `ml/output/paper_trade_history.jsonl`.

This mechanism adapts confidence without violating hard risk controls.

## Hackathon Rule Compliance Summary

- USDC-denominated carry framework with Drift as mandatory core.
- Deterministic risk-off and drawdown brakes.
- No LP vault, no junior tranche, no circular stable dependency.
- 3-month rolling tenor compatible operational model.

## Output Artifacts

- Training summary: `ml/output/training_summary.json`
- Trained models: `ml/output/models/edge_model.json`, `ml/output/models/regime_model.json`
- Inference payload: `ml/output/inference_payload.json`
- Devnet paper run: `ml/output/devnet_paper_run.json`
- Devnet run history: `ml/output/paper_trade_history.jsonl`

## Safety and Scope

- Devnet runner is paper-trading only and does not place on-chain drift orders.
- It is intended for proof, calibration, and submission verification workflow.
