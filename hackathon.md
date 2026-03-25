This document explains strategy uniqueness, implementation quality, and deployment viability today.
It maps research evidence to code modules and Drift side-track judging criteria.

# Build-A-Bear Submission Brief

## Strategy Name

Drift Adaptive Funding Carry with Online Confidence Learning

## Why This Strategy Is Unique

- Combines three layers usually shipped separately:
  - supervised edge prediction,
  - regime routing,
  - online calibration from realized outcomes.
- Most carry systems keep static confidence weights after backtest.
- This system learns confidence online from paper/live outcomes while preserving deterministic risk rails.

## Why It Is Competitive For Drift Side Track

- Uses Drift-style perp carry logic and risk-first design.
- Keeps base accounting in stable collateral style logic for USDC-aligned operations.
- Provides robust production hooks: model export, payload generation, runtime orchestration, devnet-linked evidence.

## Research-Backed Design

- Funding-driven returns motivation: `papers/2201.04699.md:24` and `papers/2201.04699.md:26`.
- 4-hour and 48-hour practical cadence references: `papers/2408.05382.md:25`, `papers/2408.05382.md:670`.
- Residual and constrained arbitrage architecture inspiration: `papers/2106.04028.md:16`, `papers/2106.04028.md:20`.
- Tail-risk-aware hedging emphasis: `papers/2411.01121.md:1`.

## If Better Market Strategies Exist

The code already implements an upgrade path instead of a fixed strategy:

- Swappable data source and retraining flow: `ml_pipeline/scripts/run_production_training.py:16`.
- Model artifact persistence and replacement: `ml_pipeline/training/pipeline.py:60`.
- Runtime consumes generated payload rather than hardcoded logits: `apps/bot/src/live/ml_signals.ts:1`.
- Online calibrator updates live confidence after realized outcomes: `apps/bot/src/live/online_calibrator.ts:1`.

This means if a better alpha process is discovered, the stack absorbs it through retraining and payload replacement without changing risk rails.

## Code References By Capability

## Data and Training

- Historical real-data builder: `ml_pipeline/data/binance_history.py:1`
- Feature engineering: `ml_pipeline/features/builder.py:1`
- Supervised models: `ml_pipeline/models/supervised.py:1`
- RL training: `ml_pipeline/rl/trainer.py:1`
- Walk-forward evaluation: `ml_pipeline/evaluation/walk_forward.py:1`
- Production train script: `ml_pipeline/scripts/run_production_training.py:1`

## Runtime and Risk

- Runtime orchestration: `apps/bot/src/runtime/orchestrator.ts:1`
- Risk guard: `apps/bot/src/risk/policy.ts:1`
- Regime router: `apps/bot/src/strategy/router.ts:1`
- Allocation engine: `apps/bot/src/allocation/sizer.ts:1`
- Rebalance planner: `apps/bot/src/rebalance/planner.ts:1`

## Devnet and Verification

- Devnet wallet integration: `apps/bot/src/live/devnet_wallet.ts:1`
- Live feed loader: `apps/bot/src/live/binance_live_source.ts:1`
- Devnet paper-runner: `apps/bot/src/live/devnet_paper_runner.ts:1`

## Deployment and Operations

Single operator commands:

- `npm run ml:production`
- `npm run bot:devnet:paper`

Required env var for devnet operation:

- `DEVNET_KEYPAIR_PATH`

## Why This Is Revolutionary Relative To Typical Vault Bots

- Traditional vault bots are rule-only or static-model.
- This architecture is hybrid and adaptive:
  - deterministic risk constraints,
  - ML alpha layer,
  - online confidence learner,
  - devnet-linked verification artifacts.
- It bridges research-grade modeling and operations-grade reliability in one runnable pipeline.

## Submission Evidence Bundle

- `ml/output/training_summary.json`
- `ml/output/inference_payload.json`
- `ml/output/devnet_paper_run.json`
- `ml/output/paper_trade_history.jsonl`

These files provide metrics, model behavior, and wallet-linked paper-run evidence for judging.
