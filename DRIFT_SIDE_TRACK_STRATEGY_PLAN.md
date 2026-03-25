This document defines a stronger hybrid plan for Drift side-track success.
It merges edge, risk, implementation, and submission proof into one blueprint.

# Drift Adaptive Funding Carry Vault - Hybrid Winner Plan

## Mission

Launch a production-grade Ranger Earn vault that uses Drift as the core engine, stays USDC-denominated, targets sustainable net APY above 10 percent, and survives a rolling 3-month lock cycle with strict downside controls.

## Why This Hybrid Is Stronger

- Keeps your friend's strongest parts: clear alpha thesis, explicit cadence, concrete risk triggers
- Keeps the strongest technical parts: Ranger and Drift adaptor architecture, ops loops, and on-chain verifiability
- Adds a judge-facing format: parameter table, test gates, live monitoring KPIs, and submission evidence

## Primary Strategy Thesis

Use a risk-first carry stack with three capital states and deterministic switching rules:

1. Safety State: park idle capital in Drift USDC lend for baseline yield
2. Carry State: run delta-neutral basis and funding capture on top Drift markets
3. Spread State: optional cross-venue hedged overlay only when net spread is materially better than Drift-only carry

The strategy only deploys risk when projected net APY clears strict post-cost thresholds.

## Rule Compliance Mapping

| Requirement | Hybrid Plan Mapping |
| --- | --- |
| Minimum APY: 10% | Entry gate enforces net projected APY threshold above target band |
| Base Asset: USDC | Vault accounting, collateral logic, and reporting in USDC |
| Tenor: 3-month lock rolling | 90-day rolling review with monthly risk recalibration |
| Drift as core component | Drift perps, funding, and margin health used in every active state |
| Disallowed yield sources | No LP vaults, no junior tranches, no circular stables, no leverage looping design |

## Research Evidence Base

### Core Papers

- The Recurrent Reinforcement Learning Crypto Agent: https://arxiv.org/abs/2201.04699
- Optimizing Portfolio with Two-Sided Transactions and Lending: https://arxiv.org/abs/2408.05382
- Deep Learning Statistical Arbitrage: https://arxiv.org/abs/2106.04028
- Hedging and Pricing Structured Products Featuring Multiple Underlying Assets: https://arxiv.org/abs/2411.01121

### Supporting Market Predictability Papers

- Practical Forecasting of Cryptocoins Timeseries using Correlation Patterns: https://arxiv.org/abs/2409.03674
- Anticipating cryptocurrency prices using machine learning: https://arxiv.org/abs/1805.08550
- Ascertaining price formation in cryptocurrency markets with DeepLearning: https://arxiv.org/abs/2003.00803

### Evidence Used in Design Choices

- Funding profit can dominate derivative returns, supporting funding-capture as primary alpha
- 4-hour rebalance cadence and 48-hour lookback are practical for noisy crypto regimes
- Risk-aware and downside-penalized objectives outperform pure return chasing in volatile periods

## Protocol and Competition Sources

- Hackathon page: https://ranger.finance/build-a-bear-hackathon
- Ranger Earn app: https://www.app.ranger.finance/earn
- Ranger docs index: https://docs.ranger.finance/llms.txt
- Drift protocol docs: https://docs.drift.trade/protocol
- Drift funding rates: https://docs.drift.trade/protocol/trading/perpetuals-trading/funding-rates
- Drift account health: https://docs.drift.trade/protocol/trading/margin/account-health
- Drift liquidations: https://docs.drift.trade/protocol/trading/liquidations
- Drift borrow and lend: https://docs.drift.trade/protocol/borrow-lend
- Ranger strategy setup: https://docs.ranger.finance/vault-owners/strategies/setup-guide
- Ranger bots and scripts: https://docs.ranger.finance/vault-owners/operations/bots-and-scripts
- Ranger deployed programs: https://docs.ranger.finance/security/deployed-programs
- Ranger audits: https://docs.ranger.finance/security/audits
- Cobo API docs: https://www.cobo.com/developers/v2/developer-tools/cobo-cli/api-documentation

## Strategy Architecture

### Market Universe

- Tier 1: BTC-PERP, ETH-PERP, SOL-PERP
- Tier 2 only if liquidity and slippage metrics pass hard filters

### Alpha Components

- Funding capture
- Basis convergence
- Baseline lending yield on idle USDC
- Optional cross-venue spread capture when execution risk is justified

### Net APY Model

`net_apy = lend_apy + funding_apr + basis_apr - taker_fees_apr - maker_fees_apr - slippage_apr - borrow_apr - risk_haircut_apr`

No position is opened unless net_apy is above entry threshold with safety margin.

### Regime Router

- If net_apy is high and stable, use Carry State
- If spreads are exceptional and execution quality is strong, allow Spread State
- If edge weakens or risk rises, revert to Safety State

## Parameter Sheet (Judge Friendly)

| Parameter | Initial Value | Purpose |
| --- | --- | --- |
| Signal lookback | 48 hours | Reduce noise and avoid stale long-history bias |
| Rebalance cadence | 4 hours | Aligns with evidence and controls turnover |
| Funding check | Hourly | Funding updates are hourly on Drift |
| Min entry net APY | 12% | Keeps buffer above 10% prize floor |
| Exit APY threshold | 8% | Hysteresis to avoid churn |
| Per-market cap | 25% TVL | Concentration control |
| Gross exposure cap | 2.2x TVL | Avoid leverage creep and tail fragility |
| Health warning band | < 60 | Early risk reduction |
| Health soft de-risk | < 55 | Partial unwind and tighter limits |
| Health hard de-risk | < 45 | Full flatten to safety state |
| Daily soft drawdown | -5% | Stop adding risk and reduce positions |
| Daily hard drawdown | -8% | Force flatten and cooldown |
| Rolling max drawdown cap | -12% | Vault-level survival guardrail |
| Oracle divergence cap | 40 bps | Protect against bad marks and dislocations |
| Max slippage per rebalance | 15 bps Tier 1 | Keep execution quality predictable |

## Position Lifecycle Rules

### Entry

- Edge clears entry threshold after all cost haircuts
- Liquidity depth supports target size within slippage cap
- Account health remains above warning band after stress add-ons

### Hold

- Re-price expected edge every hour
- Rebalance every 4 hours or on threshold breach
- Maintain near-delta-neutral profile in carry states

### Exit

- Funding flips adverse for two consecutive checks
- Net projected APY drops below exit threshold
- Health, drawdown, or oracle guardrails breach

### Circuit Breaker

- Hard drawdown, telemetry failure, or severe market dislocation triggers full flatten
- Capital parks in USDC lending until cooldown conditions pass

## Risk Framework

### Hard Limits

- USDC base asset only for vault accounting
- No banned yield primitives under competition rules
- No strategy mode that depends on high-leverage looping

### Drift-Specific Protection

- Continuous health monitor loop
- Liquidation-distance estimator and stress replay before adding risk
- Funding-window order aggressiveness throttling

### Operational Protection

- Dual-RPC failover
- Stale-data detector
- Safe-mode fallback on connector instability

## Technical Implementation Blueprint

### Core On-Chain Components

- Ranger Vault program: `vVoLTRjQmtFpiYoegx285Ze4gsLJ8ZxgFKVcuvmG1a8`
- Ranger Drift adaptor: `EBN93eXs5fHGBABuajQqdsKRkCgaqtJa8vEFD6vKXiP`

### Bot and Service Loops

- Signal loop: hourly data build and edge scoring
- Rebalance loop: 4-hour target update and execution
- Health loop: near-real-time risk checks and auto de-risking
- Reporting loop: daily PnL attribution and KPI snapshot

### Suggested Modules

- `signals/funding_basis.ts`
- `risk/health_guard.ts`
- `execution/rebalance_engine.ts`
- `ops/circuit_breaker.ts`
- `reporting/kpi_pack.ts`

## Validation and Go-Live Gates

### Backtest Gate

- Net APY above target with full trading-cost model
- Max drawdown within pre-set cap
- Positive edge persistence across market regimes

### Forward Test Gate

- 2 to 3 weeks of paper or low-size live execution
- No risk-rule violations
- Slippage and turnover remain inside model tolerances

### Launch Gate

- Runbook complete
- Alerting live
- Emergency flatten tested

## Performance Attribution Template

Daily report fields:

- Total PnL and net APY
- Funding income contribution
- Basis convergence contribution
- Lending yield contribution
- Fees and slippage drag
- Exposure by market and state
- Max intraday drawdown and current health buffer

## Submission Package Plan

### Required Artifacts

- 3-minute demo video showing thesis, architecture, risk controls, and live traces
- Strategy document with formulas, thresholds, and emergency logic
- Code repository with reproducible scripts and config references
- On-chain wallet or vault address from build window activity
- CEX CSV and read-only API key only if cross-venue leg is used

### Judge Narrative

- Real edge: funding and basis carry, not fragile token emissions
- Real risk discipline: deterministic rules, buffers, and hard circuit breakers
- Real production path: adaptor-based deployment, monitoring, and audit-aware operations

## Implementation Timeline

### Week 1

- Finalize parameters, market filters, and backtest harness
- Stand up data and reporting stack

### Week 2

- Integrate execution and risk engine with Drift and Ranger flows
- Complete dry-runs and stress tests

### Week 3

- Run forward test and parameter freeze
- Prepare demo, documentation, and verification pack

## Final Positioning

Name this submission `Drift Adaptive Funding Carry Vault`.

One-line pitch:

`A USDC Ranger vault that harvests Drift-native funding and basis carry only when post-cost edge is strong, while enforcing strict health and drawdown guardrails for production-safe compounding.`
