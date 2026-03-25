# Drift Borrow and Lend

- Source URL: https://docs.drift.trade/protocol/borrow-lend
- Retrieved At: 2026-03-25 11:01:17 UTC
- Fetch Status: ok

## Highlighted Requirements For This Project

- Use USDC lending as baseline carry for risk-off strategy state.
- Include utilization-sensitive borrow costs in net edge computation.
- Avoid borrow-driven loops and keep conservative collateral policy.

## Full Documentation Capture

# What is Borrow & Lend?

Drift Protocol is also a decentralised money markets protocol that supports the borrowing and lending of assets.

As a decentralised money markets protocol, you can:

* deposit assets into Drift Protocol and earn yield; or
* borrow assets deposited by other Lenders at a variable interest rate.

Lenders provide liquidity to the market to earn yield on their assets, while borrowers are able to borrow from available liquidity pools in an over-collateralised fashion. Any interest earned from lending is vested immediately and automatically compounds.

You can view current lend and borrow interest rates in the Drift app at <https://app.drift.trade/earn>
