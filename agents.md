This file defines project agents for operations, risk, and live execution.
It maps responsibilities and handoffs for production-grade hackathon deployment workflows.

# Agent Operating Model

## 1. Research Agent

- Tracks relevant research updates for funding carry, basis, and RL execution quality.
- Curates references from local `papers/` markdown conversions and source papers.
- Produces feature and reward hypotheses before model retraining windows.

## 2. Data Agent

- Owns historical and near-real-time data ingestion from Binance endpoints.
- Maintains data cache lifecycle and validates schema integrity per pipeline run.
- Handles fallback to synthetic generation when external data is unavailable.

## 3. ML Training Agent

- Runs supervised edge model and regime model training with walk-forward evaluation.
- Runs RL policy training and policy-selection between policy-gradient and grid fallback.
- Persists model artifacts and training summaries for runtime consumption.

## 4. Risk Agent

- Enforces hard constraints independent of ML outputs.
- Validates health thresholds, drawdown brakes, and risk-off transitions.
- Guards strategy from disallowed structures from the Drift Side Track rules.

## 5. Runtime Agent

- Converts live snapshots and ML payloads into strategy state and allocation outputs.
- Executes rebalance planning and paper-trade simulation loops.
- Produces KPI and attribution reports for operational and judging evidence.

## 6. Devnet Agent

- Connects to Solana Devnet using user-provided keypair file.
- Reads wallet SOL balance and computes paper portfolio notional reference.
- Runs devnet paper-trading cycle and stores output artifacts.

## 7. Submission Agent

- Builds hackathon-ready deliverables from generated artifacts.
- Maintains strategy narrative, risk table, and code traceability references.
- Prepares verification package for judges and optional CEX verification path.

## Agent Hand-Off Contract

- Data Agent outputs row-set and cache path.
- ML Training Agent outputs model files and inference payload.
- Runtime Agent outputs actions, simulated fills, and KPI bundle.
- Devnet Agent outputs wallet-linked paper-trading artifact.
- Submission Agent packages all outputs into final submission docs.

## Single-Command Operator Mode

- `npm run ml:production` executes training and payload generation.
- `npm run bot:devnet:paper` executes devnet wallet-connected paper cycle.
- Operators only need env vars and a devnet keypair JSON path.
