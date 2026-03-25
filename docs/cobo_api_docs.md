# Cobo API Documentation

- Source URL: https://www.cobo.com/developers/v2/developer-tools/cobo-cli/api-documentation
- Retrieved At: 2026-03-25 11:01:22 UTC
- Fetch Status: ok

## Highlighted Requirements For This Project

- Use only for optional CEX verification or execution support workflows.
- Prepare read-only API evidence package if cross-venue logic is enabled.
- Define credential boundaries and operational security controls.

## Full Documentation Capture

[Skip to main content](#content-area)

[Developer Hub home page![light logo](https://mintcdn.com/cobo-docs/PV4XalUucTJe6-EG/logo/Cobo-Developers-final72px.svg?fit=max&auto=format&n=PV4XalUucTJe6-EG&q=85&s=30e8520daf193933639b50447e692d31)![dark logo](https://mintcdn.com/cobo-docs/PV4XalUucTJe6-EG/logo/dark.png?fit=max&auto=format&n=PV4XalUucTJe6-EG&q=85&s=b50e8893f4500368464d76a8fafeb988)](https://www.cobo.com/developers/v2/guides/overview/introduction)

🌐 Version 2.0 EN

Search...

⌘KAsk AI

* [Product Manuals](https://manuals.cobo.com/en/portal/introduction)
* [Portal Login](https://portal.cobo.com/login?utm_term=developer_login.nav)
* [Free Trial](https://www.cobo.com/lp/14-day-free-trial-cobo?utm_term=developer_freetrial.nav)
* [Free Trial](https://www.cobo.com/lp/14-day-free-trial-cobo?utm_term=developer_freetrial.nav)

Search...

Navigation

Utility commands

View API documentation

[Guides](/developers/v2/guides/overview/introduction)[API References](/developers/v2/api-references/playground)[Developer Tools](/developers/v2/developer-tools/quickstart-python)[Payments Solution](/developers/v2/payments-redirect/redirect)[Cobo Portal Apps](/developers/v2/apps/introduction)

##### WaaS SDKs

* [Get started with Python SDK](/developers/v2/developer-tools/quickstart-python)
* [Get started with Java SDK](/developers/v2/developer-tools/quickstart-java)
* [Get started with Go SDK](/developers/v2/developer-tools/quickstart-go)
* [Get started with JavaScript SDK](/developers/v2/developer-tools/quickstart-javascript)

##### Cobo CLI

* Overview
* Get started
* API commands
* App development
* Webhooks
* [Key management](/developers/v2/developer-tools/cobo-cli/key-management)
* Utility commands

  + [View real-time logs](/developers/v2/developer-tools/cobo-cli/real-time-logs)
  + [Open browser shortcuts](/developers/v2/developer-tools/cobo-cli/open-browser-shortcuts)
  + [View API documentation](/developers/v2/developer-tools/cobo-cli/api-documentation)
* Command reference

##### Cobo UI Toolkit

* [Introduction to Cobo UI Toolkit](/developers/v2/developer-tools/uitoolkit-intro)
* [UI Toolkit API reference](/developers/v2/developer-tools/uitoolkit-api)

##### Other tools

* [Get testnet coins](/developers/v2/developer-tools/get-testnet-coins)
* UCW SDKs

On this page

* [Usage](#usage)
* [Arguments](#arguments)
* [Options](#options)
* [Example](#example)

Utility commands

# View API documentation

Copy page

Fetch and update the latest WaaS 2.0 OpenAPI specification with Cobo CLI for up-to-date API definitions.

Copy page

Try [Cobo WaaS Skill](/developers/v2/guides/overview/cobo-waas-skill) in your AI coding assistant (Claude Code, Cursor, etc.). Describe your needs in natural language to auto-generate production-ready SDK code and debug faster 🚀

Use this command to fetch and update the latest WaaS 2.0 OpenAPI specification. Cobo CLI downloads the YAML file and saves it to your local configuration directory, ensuring you have the most up-to-date API definitions.

## [​](#usage) Usage

Report incorrect code

Copy

Ask AI

```
cobo doc <topic_or_path> [options]
```

## [​](#arguments) Arguments

`<topic_or_path>`: Specifies the documentation topic or the API operation path. Possible values include:

* `guides`: (Default)Opens the [Introduction to WaaS 2.0](/developers/v2/guides/overview/introduction) guide.
* `api`: Opens the [API Reference](/developers/v2/api-references/playground) page.
* `sdk`: Opens the [WaaS SDKs](/developers/v2/developer-tools/quickstart-python) guide.
* `apps`: Opens the [Cobo Portal App development](/developers/v2/apps/introduction) guide.
* API endpoint paths: Displays detailed information on API operations available for the specified path such as `/wallets`.

## [​](#options) Options

`-u`, `--update`: Update the OpenAPI specification for WaaS 2.0, ensuring you have the latest API definitions and documentation. With this option used, this command will only perform the updates and then exit. After a successful update, Cobo CLI confirms the operation with a “specification file downloaded successfully” message.

## [​](#example) Example

Report incorrect code

Copy

Ask AI

```
cobo doc /wallets/mpc/vaults
```

This command fetches the documentation of the `/wallets/mpc/vaults` endpoint, including its description, parameters, and response format.

Was this page helpful?

YesNo

[Open browser shortcuts](/developers/v2/developer-tools/cobo-cli/open-browser-shortcuts)[Global options](/developers/v2/developer-tools/cobo-cli/global-options)

⌘I

[twitter](https://twitter.com/Cobo_Global)[github](https://github.com/CoboGlobal)[linkedin](https://www.linkedin.com/company/cobo-global)

Assistant

Responses are generated using AI and may contain mistakes.

[Contact support](/cdn-cgi/l/email-protection#94fcf1f8e4d4f7fbf6fbbaf7fbf9)
