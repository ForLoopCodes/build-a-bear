# DriftPack Vault

Multi-Market Funding Rate Optimizer for Ranger Earn. A production-ready vault strategy that dynamically allocates across Drift perpetual markets to capture funding payments.

## Quick Start

```bash
npm install
cp .env.example .env
# Edit .env with your RANGER_API_KEY and WALLET_PRIVATE_KEY
npm run dev
```

## Architecture

```
src/
├── vault.ts          # Main vault orchestrator
├── types.ts          # Type definitions
├── config.ts         # Configuration
├── api/
│   ├── drift.ts      # Drift Data API client
│   └── ranger.ts     # Ranger API client
├── adaptors/
│   └── drift.ts      # Drift Protocol SDK adaptor
├── risk/
│   └── manager.ts    # Risk management engine
├── strategies/
│   └── optimizer.ts  # Funding rate optimizer
└── monitoring/
    └── dashboard.ts  # Terminal dashboard
```

## Strategy

The vault monitors funding rates across Drift perp markets and dynamically allocates capital to markets with the highest annualized funding rates. It collects funding payments from being on the opposite side of net positioning.

**Key features:**
- Multi-market allocation (SOL, BTC, ETH, ARB, AVAX, LINK, MATIC)
- Real-time funding rate monitoring
- Risk-adjusted position sizing
- Circuit breaker for drawdown protection
- Delta-neutral position management

## Risk Parameters

- Max leverage per market: 5x
- Max total leverage: 10x
- Max position per market: 20% of TVL
- Drawdown circuit breaker: 8%
- Rebalance threshold: 5% shift

## Commands

```bash
npm run dev       # Run vault in dev mode
npm run build     # Build TypeScript
npm run test      # Run unit tests
npm run backtest  # Run backtest analysis
npm run deploy    # Deploy vault
```

## Docs

See SPEC.md for full strategy documentation and backtesting results.
