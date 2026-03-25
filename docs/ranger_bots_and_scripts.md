# Ranger Bots and Scripts

- Source URL: https://docs.ranger.finance/vault-owners/operations/bots-and-scripts
- Retrieved At: 2026-03-25 11:01:19 UTC
- Fetch Status: ok

## Highlighted Requirements For This Project

- Build loop architecture for rebalancing, monitoring, and maintenance tasks.
- Document retry policy, health checks, and operational incident response.
- Use automation guidance to prove production readiness to judges.

## Full Documentation Capture

[Skip to main content](#content-area)

[Ranger Earn Documentation home page![light logo](https://mintcdn.com/ranger-1fe08bd5/_VoJGCuYTYavLBFr/logo/light.svg?fit=max&auto=format&n=_VoJGCuYTYavLBFr&q=85&s=82bd8a4115fa9b2ba842c01b0bcfbc52)![dark logo](https://mintcdn.com/ranger-1fe08bd5/_VoJGCuYTYavLBFr/logo/dark.svg?fit=max&auto=format&n=_VoJGCuYTYavLBFr&q=85&s=3fc898e162cb95ac31a5c0cfcbff3ae4)](/)

Search...

⌘K

* [Support](mailto:support@voltr.xyz)
* [Launch App](https://app.ranger.finance/earn)
* [Launch App](https://app.ranger.finance/earn)

Search...

Navigation

Operations

Running Bots & Scripts

[Documentation](/)[Vault Managers](/vault-owners/overview)[Yield Protocols](/protocols/overview)[Composing Protocols](/protocols/cpi-integration)[Security](/security/best-practices)

##### Getting Started

* [Owner Overview](/vault-owners/overview)
* [Vault Initialization Guide](/vault-owners/initialization/choose-your-path)
* [Via User Interface](/vault-owners/initialization/via-ui)

##### Vault Setup (SDK)

* [Prerequisites (SDK)](/vault-owners/initialization/prerequisites)
* [Vault Creation](/vault-owners/initialization/create-vault)
* [LP Token Metadata](/vault-owners/initialization/lp-metadata)
* [Vault Configuration Updates](/vault-owners/initialization/update-configuration)
* [Strategy Initialization](/vault-owners/initialization/strategy-initialization)

##### Strategies & Allocation

* [Strategy Setup Guide](/vault-owners/strategies/setup-guide)
* [Supported Integrations](/vault-owners/strategies/integrations)
* [Fund Allocation Guide](/vault-owners/allocation/overview)
* [Allocation Prerequisites](/vault-owners/allocation/prerequisites)
* [Fund Allocation](/vault-owners/allocation/deploy-funds)

##### Operations

* [Vault Operations](/vault-owners/operations/overview)
* [Running Bots & Scripts](/vault-owners/operations/bots-and-scripts)
* [Monitoring & API](/vault-owners/operations/monitoring)
* [Fees & Accounting](/vault-owners/fees-and-accounting)

##### Go-To-Market

* [Go-To-Market Checklist](/vault-owners/go-to-market/checklist)
* [Indexing & Listing on Ranger](/vault-owners/go-to-market/indexing-and-listing)
* [Token Verification](/vault-owners/go-to-market/token-verification)
* [Frontend Integration Guide](/vault-owners/frontend-integration)

##### API

* [API Overview](/developers/api-overview)
* [Vaults Endpoints](/developers/endpoints/vaults)
* [Vault Endpoints](/developers/endpoints/vault)

##### SDK

* [SDK Reference](/developers/sdk-reference)

On this page

* [Why Automation Is Needed](#why-automation-is-needed)
* [Script Repositories](#script-repositories)
* [Rebalance Bot Template](#rebalance-bot-template)
* [Script Structure Example](#script-structure-example)
* [Key Considerations](#key-considerations)

Operations

# Running Bots & Scripts

Automate vault operations for optimal performance

Vault operations require automation for optimal performance.

**You must host your own automation.** Ranger Earn/Ranger does not provide managed bot services. You are responsible for deploying, running, and monitoring your own scripts and bots.

## [​](#why-automation-is-needed) Why Automation Is Needed

| Task | Why It Needs Automation |
| --- | --- |
| **Rebalancing** | Yield rates change frequently; manual rebalancing misses optimal allocations |
| **Reward claiming** | Protocol rewards accrue continuously; manual claiming leaves value uncollected |
| **Reward swapping** | Claimed reward tokens need to be swapped to base asset to compound |
| **Position monitoring** | Raydium CLMM positions go out-of-range; Drift positions need risk monitoring |
| **Fee harvesting** | Accumulated fees should be harvested periodically |

## [​](#script-repositories) Script Repositories

| Repository | Use Case |
| --- | --- |
| [ranger-finance/lend-scripts](https://github.com/voltrxyz/lend-scripts) | Lending strategy init (Project0, Save) |
| [ranger-finance/kamino-scripts](https://github.com/voltrxyz/kamino-scripts) | Kamino strategy init, rewards claiming |
| [ranger-finance/drift-scripts](https://github.com/voltrxyz/drift-scripts) | Drift vaults/lend/perps strategy init, position management |
| [ranger-finance/spot-scripts](https://github.com/voltrxyz/spot-scripts) | Jupiter Swap/Lend strategy init |
| [ranger-finance/client-raydium-clmm-scripts](https://github.com/voltrxyz/client-raydium-clmm-scripts) | Raydium CLMM strategy init |
| [ranger-finance/trustful-scripts](https://github.com/voltrxyz/trustful-scripts) | Trustful adaptor strategy init |
| [ranger-finance/rebalance-bot-template](https://github.com/voltrxyz/rebalance-bot-template) | Production-ready rebalance bot (equal-weight allocation) |

## [​](#rebalance-bot-template) Rebalance Bot Template

The [rebalance-bot-template](https://github.com/voltrxyz/rebalance-bot-template) is a production-ready bot that handles the core automation tasks listed above. It distributes funds equally across lending strategies on a fixed schedule and includes:

* **Rebalance loop** — equal-weight allocation across all strategies, triggered on interval and on new deposits
* **Refresh loop** — keeps on-chain receipt values up to date
* **Harvest fee loop** — collects protocol/admin/manager fees
* **Claim reward loops** — claims Kamino farm rewards and swaps them back via Jupiter

Supports Drift, Jupiter Lend, Kamino Market, and Kamino Vault strategies out of the box.

Copy

```
git clone https://github.com/voltrxyz/rebalance-bot-template.git
cd rebalance-bot-template
pnpm install
cp .env.example .env   # fill in your vault addresses and keypair
pnpm run build && pnpm start
```

See the [repository README](https://github.com/voltrxyz/rebalance-bot-template#readme) for full configuration options and Replit deployment instructions.

## [​](#script-structure-example) Script Structure Example

A basic rebalancing script:

Copy

```
import { VoltrClient } from "@voltr/vault-sdk";
import { Connection, Keypair } from "@solana/web3.js";

async function main() {
  const connection = new Connection(process.env.RPC_URL!);
  const client = new VoltrClient(connection);

  const managerKp = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(process.env.MANAGER_KEY!))
  );

  // 1. Check current allocations
  const vaultData = await client.getVault(vaultPubkey);
  const idleBalance = vaultData.asset.totalValue;

  // 2. Check strategy yields (via API or protocol SDKs)
  // 3. Determine optimal allocation
  // 4. Execute rebalance transactions

  console.log("Rebalance complete");
}

main().catch(console.error);
```

## [​](#key-considerations) Key Considerations

* **Gas budget**: Ensure your manager wallet has enough SOL for all automated transactions. Monitor and top up regularly.
* **Error handling**: Scripts should handle transaction failures gracefully (retry logic, alerting).
* **Rate limiting**: Respect RPC provider rate limits. Use exponential backoff on failures.
* **Idempotency**: Design scripts to be safely re-runnable in case of partial failures.

[Vault Operations](/vault-owners/operations/overview)[Monitoring & API](/vault-owners/operations/monitoring)

⌘I

[x](https://x.com/ranger_finance)[github](https://github.com/ranger-finance)

[Powered byThis documentation is built and hosted on Mintlify, a developer documentation platform](https://www.mintlify.com?utm_campaign=poweredBy&utm_medium=referral&utm_source=ranger-1fe08bd5)
