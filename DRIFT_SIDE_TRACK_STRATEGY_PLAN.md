This document defines an ML-first Drift vault plan for the hackathon.
It maps papers to models, data pipelines, training, and bot execution.

# Drift Adaptive Funding Vault - ML and RL Build Plan

## Goal

Build a production-ready Ranger vault manager bot that uses Drift as the core venue, stays USDC-denominated, targets net APY above 10 percent, and enforces strict drawdown and liquidation safety over a rolling 3-month lock profile.

## Hackathon Constraints and Design Rules

- Base asset must be USDC.
- APY target must be at least 10 percent net.
- Tenor is 3-month rolling.
- Avoid disallowed sources: DEX LP vaults, junior tranches, circular yield stables, and high-leverage looping.
- Strategy must be deployable with clear risk controls and on-chain evidence.

## Strategy Architecture

### Three Strategy States

1. Safety State: keep capital in Drift USDC lend and minimal risk.
2. Carry State: run delta-neutral funding and basis capture on Drift core markets.
3. Spread State: optional cross-venue hedge overlay only when net post-cost spread is meaningfully higher.

### What ML Controls

- State selection and transition timing.
- Market ranking and per-market allocation.
- Position sizing under risk limits.
- Exit urgency when edge decay or risk rises.

### Hard Risk Authority

Risk limits are deterministic and override all models.

- Health soft de-risk below 55.
- Health hard flatten below 45.
- Daily soft drawdown at -5 percent.
- Daily hard drawdown at -8 percent.
- Rolling drawdown cap at -12 percent.

## How The Seven Papers Are Used

| Paper | Practical Use In This Build |
| --- | --- |
| 2201.04699 The Recurrent Reinforcement Learning Crypto Agent | Justifies funding-profit alpha and cost-aware reward design, including funding as explicit reward component |
| 2408.05382 Optimizing Portfolio with Two-Sided Transactions and Lending | Provides 4-hour rebalance and 48-hour lookback defaults, plus downside-penalized PnL reward design |
| 2106.04028 Deep Learning Statistical Arbitrage | Provides residual-based signal decomposition and constrained policy architecture |
| 2411.01121 Hedging and Pricing Structured Products | Supports tail-risk-aware objective and stronger downside penalties in policy learning |
| 2409.03674 Practical Forecasting of Cryptocoins Timeseries | Supports cross-asset correlation features and lead-lag predictors for regime scoring |
| 1805.08550 Anticipating Cryptocurrency Prices Using Machine Learning | Supports broad crypto inefficiency premise and simple robust model baselines |
| 2003.00803 Ascertaining Price Formation In Cryptocurrency Markets | Supports microstructure features and short-horizon direction prediction |

## ML System Blueprint

## 1) Data Layer

### Required Data Sources

- Drift market data: mark price, oracle price, funding rates, open interest, spreads, volume.
- Drift borrow-lend data: lend APY, borrow APY, utilization.
- Drift account risk data: account health, margin usage, liquidation distance.
- Ranger vault data: TVL, deposits, withdrawals, strategy allocations, fee events.
- Optional CEX data if Spread State is enabled.

### Data Ingestion Plan

- Pull hourly and sub-hourly snapshots for all target markets.
- Backfill at least 12 to 24 months where possible.
- Store immutable raw files and normalized feature tables.
- Build idempotent incremental updates.

### Dataset Schema

- `timestamp`
- `market`
- `funding_rate_hourly`
- `funding_apr_annualized`
- `basis_bps`
- `mark_oracle_divergence_bps`
- `bid_ask_spread_bps`
- `volume_1h`
- `open_interest`
- `volatility_1h`
- `volatility_24h`
- `lend_apy`
- `borrow_apy`
- `utilization`
- `health_proxy`
- `execution_cost_estimate_bps`
- `realized_next_4h_pnl`
- `realized_next_4h_net_apy`

## 2) Feature Layer

### Feature Groups

- Funding features: current funding, moving averages, funding momentum, funding sign persistence.
- Basis features: perp-spot basis level, z-score, basis trend.
- Microstructure features: spread, orderbook imbalance proxy, volume shocks.
- Risk features: realized volatility, jump indicators, oracle divergence, health headroom.
- Carry features: lend APY, borrow APY, utilization slope.
- Regime features: clustering states from volatility, correlation, and spread stability.

### Feature Horizon Design

- Fast horizon: 1h, 2h, 4h.
- Context horizon: 24h, 48h.
- Structural horizon: 7d rolling for stability checks.

## 3) Modeling Layer

### Model A: Edge Forecaster (Supervised)

Target: next-4h net edge after costs.

- Inputs: full feature set.
- Outputs: expected net APY score and confidence interval.
- Baselines: linear, gradient boosting, light neural model.
- Use case: trade gate and market ranking.

### Model B: Regime Classifier

Target: classify environment into stable carry, unstable carry, or risk-off.

- Inputs: volatility, spread behavior, funding stability, divergence metrics.
- Output: regime label with confidence.
- Use case: state router between Safety, Carry, and Spread.

### Model C: RL Allocation Policy

Target: choose allocations and risk budgets under constraints.

- Action space: per-market target weights and strategy-state choice.
- Observation: edge model outputs, regime probabilities, risk metrics.
- Reward: risk-adjusted PnL with penalties for turnover, drawdown, and health deterioration.
- Candidate algorithms: SAC first, PPO as backup.

Reward template:

`reward_t = pnl_t - a*loss_t - b*cost_t - c*drawdown_penalty_t - d*health_penalty_t - e*turnover_penalty_t`

## 4) Decision Layer

### Hybrid Decision Stack

1. Hard risk checks pass.
2. Regime model approves state.
3. Edge model exceeds threshold with confidence.
4. RL policy proposes allocations.
5. Rule engine clips allocations to compliance limits.

### Entry and Exit Defaults

- Entry threshold: projected net APY >= 12 percent.
- Exit threshold: projected net APY <= 8 percent.
- Funding adverse for two checks triggers partial or full exit.
- Any hard risk breach forces full flatten.

## Training Pipeline

## Stage 0: Data Quality and Label Integrity

- Validate timestamp continuity.
- Validate missing-value policy.
- Validate funding and price alignment.
- Validate leakage prevention in labels.

## Stage 1: Supervised Pretraining

- Train edge model on rolling windows.
- Use walk-forward cross-validation, never random split.
- Track calibration quality, not only RMSE.
- Export confidence intervals for trade veto logic.

## Stage 2: Simulator and RL Training

- Build event-driven simulator with realistic costs.
- Include fees, slippage, borrow costs, funding payments, and health constraints.
- Train SAC with 4-hour action cadence and 48-hour context window.
- Train on multiple market periods: trend, chop, stress.

## Stage 3: Offline Policy Evaluation

- Use fixed historical replay.
- Compare against baselines:
  - pure USDC lend baseline
  - rule-based carry strategy
  - supervised-only allocator
- Evaluate APY, Sharpe, Sortino, max drawdown, turnover, liquidation distance.

## Stage 4: Paper Trading and Shadow Mode

- Run 2 to 3 weeks with real-time data and no capital risk.
- Validate decision latency, execution realism, and alert quality.
- Gate live launch on zero critical risk incidents.

## Training Improvements Roadmap

### Improvement 1: Regime-Aware Curriculum

- Start training on stable periods.
- Add volatile and crash periods gradually.
- Improve policy robustness before live run.

### Improvement 2: Cost Model Hardening

- Learn slippage model from simulated execution traces.
- Stress with worse-than-observed cost scenarios.

### Improvement 3: Ensemble Gating

- Combine two edge models and require agreement for high-risk entries.
- Lower false positives in weak-edge regimes.

### Improvement 4: Uncertainty-Aware Sizing

- Scale exposure by confidence and tail-risk estimates.
- Keep exposure low when model uncertainty widens.

### Improvement 5: Conservative Policy Distillation

- Distill RL outputs into a simpler bounded policy for production reliability.
- Keep deterministic behavior under ops pressure.

## Bot Script Plan

## Directory Layout

```
bot/
  data/
    download_drift_history.py
    download_ranger_history.py
    build_feature_store.py
  train/
    train_edge_model.py
    train_regime_model.py
    train_rl_policy.py
    evaluate_policies.py
  runtime/
    signal_service.py
    allocation_service.py
    risk_guard.py
    execution_router.py
    reporter.py
  ops/
    healthcheck.py
    alerting.py
    runbook.md
```

## Script Responsibilities

- `download_drift_history.py`: pulls historical funding, prices, risk, and borrow-lend data.
- `build_feature_store.py`: creates model-ready feature tables and labels.
- `train_edge_model.py`: supervised predictor for next-window net edge.
- `train_regime_model.py`: regime classification for state routing.
- `train_rl_policy.py`: allocation policy learning in simulator.
- `evaluate_policies.py`: benchmark and robustness test report generation.
- `signal_service.py`: live feature inference and predictions.
- `allocation_service.py`: combine predictions and output target allocations.
- `risk_guard.py`: enforce hard risk rules and circuit breakers.
- `execution_router.py`: convert targets into Drift and Ranger actions.
- `reporter.py`: daily attribution and judge-ready logs.

## Runtime Schedule

- Every hour: data refresh and signal update.
- Every 4 hours: allocation decision and rebalance.
- Continuous: health checks and emergency controls.
- Daily: attribution report and model drift diagnostics.

## Evaluation Matrix For Hackathon

| Category | Pass Threshold |
| --- | --- |
| Net APY | >= 10 percent with cost model included |
| Max drawdown | <= 12 percent |
| Daily hard-stop breaches | zero tolerated in forward test |
| Health hard-stop breaches | zero tolerated in forward test |
| Turnover | within fee budget and no churn patterns |
| Explainability | each trade tagged with model and rule reasons |

## Compliance and Safety Layer

- USDC-only accounting and reporting.
- No disallowed strategy components.
- Deterministic hard limits independent of ML outputs.
- Fallback mode to Safety State on telemetry failure.
- Audit-aware references to Ranger deployed programs and audit reports.

## Data and Docs References

### Competition and Ranger

- https://ranger.finance/build-a-bear-hackathon
- https://www.app.ranger.finance/earn
- https://docs.ranger.finance/llms.txt
- https://docs.ranger.finance/vault-owners/strategies/setup-guide
- https://docs.ranger.finance/vault-owners/operations/bots-and-scripts
- https://docs.ranger.finance/security/deployed-programs
- https://docs.ranger.finance/security/audits

### Drift Core

- https://docs.drift.trade/protocol
- https://docs.drift.trade/protocol/trading/perpetuals-trading/funding-rates
- https://docs.drift.trade/protocol/trading/margin/account-health
- https://docs.drift.trade/protocol/trading/liquidations
- https://docs.drift.trade/protocol/borrow-lend

### Optional CEX Verification

- https://www.cobo.com/developers/v2/developer-tools/cobo-cli/api-documentation

## Delivery Plan

### Week 1

- Data ingestion, feature store, and baseline supervised model.
- Rule-based carry baseline bot with deterministic risk guard.

### Week 2

- Simulator completion and RL policy training.
- Walk-forward evaluation and stress testing.

### Week 3

- Shadow mode, parameter freeze, and failure-drill tests.
- Finalize demo, documentation, and on-chain verification package.

## Final Submission Positioning

Project name: `Drift Adaptive Funding ML Vault`.

One-line pitch:

`A USDC Ranger vault manager bot that learns funding and basis edge from Drift data, allocates with risk-constrained RL, and enforces strict health and drawdown guardrails for production-safe compounding.`
