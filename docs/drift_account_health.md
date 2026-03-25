# Drift Account Health

- Source URL: https://docs.drift.trade/protocol/trading/margin/account-health
- Retrieved At: 2026-03-25 11:01:16 UTC
- Fetch Status: ok

## Highlighted Requirements For This Project

- Implement strict health-based de-risk and flatten triggers in runtime risk engine.
- Monitor collateral and maintenance margin continuously before adding exposure.
- Document health threshold governance as part of risk management section.

## Full Documentation Capture

# Account Health Breakdown

Users can get a detailed overview of the status of their collateral and current margin requirements in the Account Health Breakdown.

The Account Health Breakdown is accessible from all [portfolio pages](https://app.drift.trade/portfolio/trade).

![](/assets/account-health-1.png)

The account health percentage indicates the overall health status of your main account, which can change based on your open positions and their margin requirements; when it reaches zero, it signifies that the weighted value of your total collateral has fallen below the maintenance margin requirement, potentially leading to liquidation. Health Breakdown is calculated as `1 - Maintenance Margin / Margin Collateral`.

## Initial and Maintenance Margin

In the Health Breakdown, you can switch between the *Initial* and *Maintenance* margin breakdowns. Initial margin represents the total collateral you deposited across all markets, calculated with their respective asset weights. It is the amount required to take risk-increasing actions. If your initial margin is fully utilized (shown as a yellow-colored bar instead of green) within your existing position margin requirements and potentially existing borrow, you may not be able to open new positions.

Non-USDC collateral carries a discount weighting; for example, SOL has an initial asset weight of 80% and a maintenance asset weight of 90%. Additionally, the initial asset weight can programmatically shrink based on total notional deposits.

Each asset has a calculated asset weight. You can see each asset’s weight in the [Cross-collateral deposits](/protocol/getting-started/cross-collateral-deposits).

![](/assets/account-health-2.png)

The total collateral in the Maintenance margin breakdown will appear greater because it represents the amount required to avoid liquidation.

Find the table for each asset’s initial and margin requirements for each market on the [Margin](/protocol/trading/margin) page.

## Assets

Under the Assets breakdown, you can see your deposited assets and Unsettled P&L. Unsettled P&L represents the unrealized profit or loss from open positions that have not yet been closed, fluctuating with market prices; it becomes realized when the positions are closed. More comprehensive explanation in [What is unsettled P&L?](/protocol/trading/profit-loss/unsettled-profit-loss)

![](/assets/account-health-3.png)

## Liabilities

Liabilities account for all of your open positions and borrows. If your liabilities are equal to or greater than your assets, you will not be able to place any new trades until you close existing positions, settle P&L, or deposit more collateral.

## Account Health Breakdown FAQ

### I have free collateral, why can’t I trade with margin?

Make sure you’re looking at the Initial Margin breakdown, not the Maintenance Margin. Initial Margin is the amount required to take risk-increasing actions, while Maintenance Margin represents the amount required to avoid liquidation.

### How can I increase my account health?

Deposit more collateral, settle P&L, repay borrowed funds, or reduce active positions.

### If the health is 0%, will the position be fully liquidated or just partially to maintain a proper health value?

It starts as being partially liquidated and progresses to full liquidation if the user doesn’t reduce the position manually or deposit more collateral.
