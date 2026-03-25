# Ranger Strategy Setup Guide

- Source URL: https://docs.ranger.finance/vault-owners/strategies/setup-guide
- Retrieved At: 2026-03-25 11:01:17 UTC
- Fetch Status: ok

## Highlighted Requirements For This Project

- Follow setup sequence for strategy account creation and adaptor wiring.
- Translate guide steps into deterministic deployment checklist for repo.
- Use this as one source of truth for manager initialization flow.

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

Strategies & Allocation

Strategy Setup Guide

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

* [Key Concepts](#key-concepts)
* [Adaptors vs. Strategies](#adaptors-vs-strategies)
* [Adaptor Program IDs](#adaptor-program-ids)
* [Available Strategies](#available-strategies)
* [Step 1: Add Adaptor](#step-1-add-adaptor)
* [Step 2: Initialize Strategy](#step-2-initialize-strategy)
* [Generic Code Snippet](#generic-code-snippet)
* [Protocol-Specific Initialization Scripts](#protocol-specific-initialization-scripts)

Strategies & Allocation

# Strategy Setup Guide

Set up strategies to deploy vault funds to DeFi protocols

After creating your vault, you need to set up strategies so funds can be deployed to DeFi protocols. This is a **two-step process**:

1. **Add the adaptor** to your vault (one-time per adaptor program, you may skip this if you have done so on the UI)
2. **Initialize the strategy** for each specific protocol/market you want to deploy to

**Vault creation ≠ Strategy initialization.** A newly created vault has no strategies. Deposited funds will sit idle until you complete the steps in this guide.

## [​](#key-concepts) Key Concepts

### [​](#adaptors-vs-strategies) Adaptors vs. Strategies

* **Adaptor**: An on-chain program that knows how to interact with a category of protocols (e.g., the Kamino adaptor interacts with Kamino, Drift adaptor interacts with Drift…)
* **Strategy**: A specific deployment target within an adaptor (e.g., “lend USDC on Kamino Main Market”)

A vault can have **multiple strategies** across **multiple adaptors**.

## [​](#adaptor-program-ids) Adaptor Program IDs

Each adaptor has a unique on-chain program ID:

Copy

```
import {
  LENDING_ADAPTOR_PROGRAM_ID,
  DRIFT_ADAPTOR_PROGRAM_ID,
} from "@voltr/vault-sdk";
```

| Adaptor | Program ID |
| --- | --- |
| **Lending Adaptor** | `aVoLTRCRt3NnnchvLYH6rMYehJHwM5m45RmLBZq7PGz` |
| **Drift Adaptor** | `EBN93eXs5fHGBABuajQqdsKRkCgaqtJa8vEFD6vKXiP` |
| **Kamino Adaptor** | `to6Eti9CsC5FGkAtqiPphvKD2hiQiLsS8zWiDBqBPKR` |

`LENDING_ADAPTOR_PROGRAM_ID` and `DRIFT_ADAPTOR_PROGRAM_ID` are exported directly from the SDK. For other adaptors (Kamino, Jupiter, Raydium, Trustful), check the respective script repositories for their program IDs.

## [​](#available-strategies) Available Strategies

| Strategy Type | Adaptor | Protocols | Guide |
| --- | --- | --- | --- |
| **Lending** | Lending Adaptor | Kamino, Marginfi, Save, Drift Spot, Jupiter Lend | See scripts below |
| **Drift Perps/JLP** | Drift Adaptor | Drift Protocol | See scripts below |
| **Raydium CLMM** | Raydium Adaptor | Raydium | See scripts below |
| **Off-chain** | Trustful Adaptor | CEX, OTC, MPC | See scripts below |

## [​](#step-1-add-adaptor) Step 1: Add Adaptor

Before initializing any strategy, you must add the corresponding adaptor program to your vault. This is a one-time operation per adaptor type.

Copy

```
import { VoltrClient } from "@voltr/vault-sdk";
import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import fs from "fs";

const connection = new Connection("your-rpc-url");
const client = new VoltrClient(connection);

const adminKp = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync("/path/to/admin.json", "utf-8")))
);

const vault = new PublicKey("your-vault-pubkey");
const adaptorProgramId = new PublicKey("adaptor-program-id");

const addAdaptorIx = await client.createAddAdaptorIx({
  vault,
  admin: adminKp.publicKey,
  payer: adminKp.publicKey,
  adaptorProgram: adaptorProgramId,
});

const txSig = await sendAndConfirmTransaction(
  [addAdaptorIx],
  connection,
  [adminKp]
);

console.log("Adaptor added:", txSig);
```

## [​](#step-2-initialize-strategy) Step 2: Initialize Strategy

Strategy initialization is protocol-specific — each protocol requires different remaining accounts and an `instructionDiscriminator`.

### [​](#generic-code-snippet) Generic Code Snippet

Copy

```
import { VoltrClient } from "@voltr/vault-sdk";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

const connection = new Connection("your-rpc-url");
const client = new VoltrClient(connection);

const adminKp = Keypair.fromSecretKey(/* ... */);
const managerKp = Keypair.fromSecretKey(/* ... */);
const vault = new PublicKey("your-vault-pubkey");
const strategy = new PublicKey("strategy-pda");
const adaptorProgram = new PublicKey("adaptor-program-id");

const instructionDiscriminator = Buffer.from([/* 8-byte discriminator */]);

const initStrategyIx = await client.createInitializeStrategyIx(
  {
    instructionDiscriminator,
  },
  {
    payer: adminKp.publicKey,
    manager: managerKp.publicKey,
    vault,
    strategy,
    adaptorProgram,
    remainingAccounts: [
      // Protocol-specific accounts
    ],
  }
);

const txSig = await sendAndConfirmTransaction(
  [initStrategyIx],
  connection,
  [adminKp]
);
```

The `instructionDiscriminator`, `strategy` address, and `remainingAccounts` are all protocol-specific. Use the initialization scripts from the protocol repositories below as reference implementations.

### [​](#protocol-specific-initialization-scripts) Protocol-Specific Initialization Scripts

| Protocol / Adaptor | Initialization Scripts |
| --- | --- |
| Kamino Adaptor | [Kamino Vault](https://github.com/voltrxyz/kamino-scripts/blob/main/src/scripts/manager-initialize-kvault.ts), [Kamino Lending Market](https://github.com/voltrxyz/kamino-scripts/blob/main/src/scripts/manager-initialize-market.ts) |
| Drift Adaptor | [Drift Lend](https://github.com/voltrxyz/drift-scripts/blob/main/src/scripts/manager-init-earn.ts), [Drift Perps](https://github.com/voltrxyz/drift-scripts/blob/main/src/scripts/manager-init-user.ts) |
| Jupiter Adaptor | [Spot via Jupiter Swap](https://github.com/voltrxyz/spot-scripts/blob/main/src/scripts/manager-initialize-spot.ts), [Jupiter Lend](https://github.com/voltrxyz/spot-scripts/blob/main/src/scripts/manager-initialize-earn.ts) |
| Trustful Adaptor | [Centralised Exchanges](https://github.com/voltrxyz/trustful-scripts/blob/main/src/scripts/manager-initialize-arbitrary.ts) |

[Strategy Initialization](/vault-owners/initialization/strategy-initialization)[Supported Integrations](/vault-owners/strategies/integrations)

⌘I

[x](https://x.com/ranger_finance)[github](https://github.com/ranger-finance)

[Powered byThis documentation is built and hosted on Mintlify, a developer documentation platform](https://www.mintlify.com?utm_campaign=poweredBy&utm_medium=referral&utm_source=ranger-1fe08bd5)
