# Ranger Docs Index llms.txt

- Source URL: https://docs.ranger.finance/llms.txt
- Retrieved At: 2026-03-25 11:01:13 UTC
- Fetch Status: ok

## Highlighted Requirements For This Project

- Treat this index as canonical sitemap for all Ranger implementation references.
- Use linked pages to source exact API, SDK, strategy, and security details.
- Track implementation decisions back to these docs for judge review clarity.

## Full Documentation Capture

# Ranger Earn Documentation

## Docs

- [API Overview](https://docs.ranger.finance/developers/api-overview.md): Ranger Earn REST API for querying vault data and building transactions
- [Vault Endpoints](https://docs.ranger.finance/developers/endpoints/vault.md): Detailed information and interaction methods for a specific vault
- [Vaults Endpoints](https://docs.ranger.finance/developers/endpoints/vaults.md): Retrieve aggregated data across all Ranger Earn vaults
- [SDK Reference](https://docs.ranger.finance/developers/sdk-reference.md): Complete reference for the Ranger Earn Vault SDK (@voltr/vault-sdk)
- [API Docs](https://docs.ranger.finance/explore/api-docs.md)
- [For Composing Protocols](https://docs.ranger.finance/explore/composing-protocols.md): Use CPI to build new DeFi primitives on top of Ranger Earn vaults
- [GitHub](https://docs.ranger.finance/explore/github.md)
- [Security](https://docs.ranger.finance/explore/security.md): Audits, deployed programs, and legal documentation
- [For Vault Managers](https://docs.ranger.finance/explore/vault-owners.md): Create, configure, and operate yield vaults on Ranger Earn
- [For Yield Protocols](https://docs.ranger.finance/explore/yield-protocols.md): Build adaptors to bring your protocol's yield strategies into Ranger Earn vaults
- [Introduction to Ranger Earn](https://docs.ranger.finance/index.md): Modular infrastructure layer for structured yield strategies on Solana
- [How It Works](https://docs.ranger.finance/introduction/how-it-works.md): Understand the Ranger Earn vault lifecycle from deposit to yield generation
- [Key Participants](https://docs.ranger.finance/introduction/key-participants.md): Understand the roles and permissions in the Ranger Earn ecosystem
- [Core Components](https://docs.ranger.finance/protocols/adaptor-creation/core-components.md): Essential components and instructions required for a Ranger Earn adaptor
- [Adaptor Creation Guide](https://docs.ranger.finance/protocols/adaptor-creation/index.md): Build custom adaptors to bridge Ranger Earn vaults with external DeFi protocols
- [Security Considerations](https://docs.ranger.finance/protocols/adaptor-creation/security.md): Security best practices for custom adaptor development
- [Cancel Request Withdraw](https://docs.ranger.finance/protocols/cpi-integration/cancel-withdraw.md): CPI instruction to cancel a pending withdrawal request
- [Deposit](https://docs.ranger.finance/protocols/cpi-integration/deposit.md): CPI instruction to deposit assets into a Ranger Earn vault
- [CPI Integration Guide](https://docs.ranger.finance/protocols/cpi-integration/index.md): Cross-Program Invocation integration with Ranger Earn vaults
- [Instant Withdraw](https://docs.ranger.finance/protocols/cpi-integration/instant-withdraw.md): CPI instruction for instant withdrawal from zero-waiting-period vaults
- [Request Withdraw](https://docs.ranger.finance/protocols/cpi-integration/request-withdraw.md): CPI instruction to initiate a withdrawal from a Ranger Earn vault
- [Withdraw](https://docs.ranger.finance/protocols/cpi-integration/withdraw.md): CPI instruction to complete a withdrawal from a Ranger Earn vault
- [DeFi Protocol Overview](https://docs.ranger.finance/protocols/overview.md): The Ranger Earn protocol architecture — vaults, adaptors, and fund flow
- [Security Audits](https://docs.ranger.finance/security/audits.md): Independent security audit results for Ranger Earn programs
- [Best Practices](https://docs.ranger.finance/security/best-practices.md): Security best practices for the Ranger Earn protocol
- [Deployed Programs](https://docs.ranger.finance/security/deployed-programs.md): Mainnet program addresses for all Ranger Earn contracts
- [Disclaimer](https://docs.ranger.finance/security/disclaimer.md): Important legal disclaimers for the Ranger Earn SDK Services
- [Terms and Conditions](https://docs.ranger.finance/security/terms.md): Terms of Service for the Ranger Earn SDK Services
- [User Overview](https://docs.ranger.finance/users/overview.md): Access automated high-yield vaults with a simple interface
- [Audit & Transparency](https://docs.ranger.finance/users/rgusd/audit-and-transparency.md): Security audits and transparent on-chain monitoring
- [Ranger USD (rgUSD)](https://docs.ranger.finance/users/rgusd/index.md): Liquid yield-bearing token delivering institutional trading strategy yields
- [Risk Management](https://docs.ranger.finance/users/rgusd/risk-management.md): Understanding and mitigating risks in rgUSD strategies
- [Yield Generation](https://docs.ranger.finance/users/rgusd/yield-generation.md): rgUSD generates yield through dynamic lending optimization
- [Vault Risk Disclosure](https://docs.ranger.finance/users/vault-risk-disclosure.md): Last Updated: 29 December 2025
- [DriftPack Arbitrage](https://docs.ranger.finance/users/vaults/driftpack-arbitrage.md)
- [Elemental USDC Lending](https://docs.ranger.finance/users/vaults/elemental-usdc-lending.md)
- [Elemental USDG Lending](https://docs.ranger.finance/users/vaults/elemental-usdg-lending.md)
- [Elemental USDS Lending](https://docs.ranger.finance/users/vaults/elemental-usds-lending.md)
- [HyperPack Arbitrage](https://docs.ranger.finance/users/vaults/hyperpack-arbitrage.md)
- [JLP HyperLoop](https://docs.ranger.finance/users/vaults/jlp-hyperloop.md)
- [Stablecoin Multi Lend](https://docs.ranger.finance/users/vaults/stablecoin-multi-lend.md)
- [Vectis UltraX Arb](https://docs.ranger.finance/users/vaults/ultrax-arbitrage.md)
- [Fund Allocation](https://docs.ranger.finance/vault-owners/allocation/deploy-funds.md): Deposit and withdraw funds between vault and strategies
- [Fund Allocation Guide](https://docs.ranger.finance/vault-owners/allocation/overview.md): Allocate funds between the vault's idle account and strategies
- [Allocation Prerequisites](https://docs.ranger.finance/vault-owners/allocation/prerequisites.md): Requirements before allocating vault funds
- [Fees & Accounting](https://docs.ranger.finance/vault-owners/fees-and-accounting.md): Understanding vault fee structures, high water marks, and profit tracking
- [Frontend Integration Guide](https://docs.ranger.finance/vault-owners/frontend-integration.md): Build a custom frontend for vault deposits and withdrawals
- [Go-To-Market Checklist](https://docs.ranger.finance/vault-owners/go-to-market/checklist.md): Pre-launch checklist for making your vault discoverable
- [Indexing & Listing on Ranger](https://docs.ranger.finance/vault-owners/go-to-market/indexing-and-listing.md): Get your vault listed on the Ranger UI
- [Token Verification](https://docs.ranger.finance/vault-owners/go-to-market/token-verification.md): Verify your LP token on Jupiter to remove wallet warnings
- [Vault Initialization Guide](https://docs.ranger.finance/vault-owners/initialization/choose-your-path.md): Get from zero to a fully operational vault
- [Vault Creation](https://docs.ranger.finance/vault-owners/initialization/create-vault.md): Create and initialize a new vault using the Ranger Earn SDK
- [LP Token Metadata](https://docs.ranger.finance/vault-owners/initialization/lp-metadata.md): Set up metadata so wallets properly display your vault's LP token
- [Prerequisites (SDK)](https://docs.ranger.finance/vault-owners/initialization/prerequisites.md): Requirements before creating a vault via the TypeScript SDK
- [Strategy Initialization](https://docs.ranger.finance/vault-owners/initialization/strategy-initialization.md): Add adaptors and initialize strategies for your vault
- [Vault Configuration Updates](https://docs.ranger.finance/vault-owners/initialization/update-configuration.md): Update vault parameters after creation
- [Via User Interface](https://docs.ranger.finance/vault-owners/initialization/via-ui.md): Create and configure a vault without writing any code
- [Running Bots & Scripts](https://docs.ranger.finance/vault-owners/operations/bots-and-scripts.md): Automate vault operations for optimal performance
- [Monitoring & API](https://docs.ranger.finance/vault-owners/operations/monitoring.md): Monitor vault performance and health using the Ranger Earn API and SDK
- [Vault Operations](https://docs.ranger.finance/vault-owners/operations/overview.md): Ongoing monitoring, automation, and cost management for live vaults
- [Owner Overview](https://docs.ranger.finance/vault-owners/overview.md): Everything you need to know about creating, managing, and operating vaults on the Ranger Earn protocol
- [Supported Integrations](https://docs.ranger.finance/vault-owners/strategies/integrations.md): Available adaptors and protocol integrations for Ranger Earn vaults
- [Strategy Setup Guide](https://docs.ranger.finance/vault-owners/strategies/setup-guide.md): Set up strategies to deploy vault funds to DeFi protocols

## OpenAPI Specs

- [openapi](https://docs.ranger.finance/api-reference/openapi.json)


Built with [Mintlify](https://mintlify.com).
