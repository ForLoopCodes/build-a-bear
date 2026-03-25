from __future__ import annotations

import os
import re
from datetime import datetime, timezone

import requests
from bs4 import BeautifulSoup
from markdownify import markdownify
from pypdf import PdfReader


ROOT = os.getcwd()
PAPERS_DIR = os.path.join(ROOT, "papers")
DOCS_DIR = os.path.join(ROOT, "docs")


PAPER_TITLES = {
    "1805.08550": "Anticipating Cryptocurrency Prices Using Machine Learning",
    "2003.00803": "Ascertaining Price Formation in Cryptocurrency Markets with DeepLearning",
    "2106.04028": "Deep Learning Statistical Arbitrage",
    "2201.04699": "The Recurrent Reinforcement Learning Crypto Agent",
    "2408.05382": "Optimizing Portfolio with Two-Sided Transactions and Lending",
    "2409.03674": "Practical Forecasting of Cryptocoins Timeseries Using Correlation Patterns",
    "2411.01121": "Hedging and Pricing Structured Products Featuring Multiple Underlying Assets",
}


DOC_SPECS = [
    {
        "name": "hackathon_page.md",
        "title": "Build-A-Bear Hackathon Page",
        "url": "https://ranger.finance/build-a-bear-hackathon",
        "needed": [
            "Keep vault base asset in USDC and show APY target above ten percent.",
            "Follow required submissions: demo video, docs, repository, on-chain verification details.",
            "Design around judging pillars: edge, risk controls, implementation, production viability, novelty.",
            "Respect disallowed yield structures and avoid leverage-loop strategies entirely.",
        ],
    },
    {
        "name": "ranger_earn_app.md",
        "title": "Ranger Earn App",
        "url": "https://www.app.ranger.finance/earn",
        "needed": [
            "Prepare listing metadata and user-facing metrics before go-to-market submission.",
            "Validate how deposits, APY display, and vault discoverability appear in production.",
            "Use app behavior as a final quality check for user experience expectations.",
        ],
    },
    {
        "name": "ranger_docs_index_llms.md",
        "title": "Ranger Docs Index llms.txt",
        "url": "https://docs.ranger.finance/llms.txt",
        "needed": [
            "Treat this index as canonical sitemap for all Ranger implementation references.",
            "Use linked pages to source exact API, SDK, strategy, and security details.",
            "Track implementation decisions back to these docs for judge review clarity.",
        ],
    },
    {
        "name": "drift_protocol_overview.md",
        "title": "Drift Protocol Overview",
        "url": "https://docs.drift.trade/protocol",
        "needed": [
            "Use Drift perps, spot, margin, and risk modules as strategy core.",
            "Align architecture with Drift execution primitives and developer automation guides.",
            "Reference this for high-level protocol rationale in strategy documentation.",
        ],
    },
    {
        "name": "drift_funding_rates.md",
        "title": "Drift Funding Rates",
        "url": "https://docs.drift.trade/protocol/trading/perpetuals-trading/funding-rates",
        "needed": [
            "Model funding contribution hourly and annualize carefully in APY calculations.",
            "Set rebalance cadence around funding updates and expected spread persistence.",
            "Apply funding caps and edge buffers in entry threshold logic.",
        ],
    },
    {
        "name": "drift_account_health.md",
        "title": "Drift Account Health",
        "url": "https://docs.drift.trade/protocol/trading/margin/account-health",
        "needed": [
            "Implement strict health-based de-risk and flatten triggers in runtime risk engine.",
            "Monitor collateral and maintenance margin continuously before adding exposure.",
            "Document health threshold governance as part of risk management section.",
        ],
    },
    {
        "name": "drift_liquidations.md",
        "title": "Drift Liquidations",
        "url": "https://docs.drift.trade/protocol/trading/liquidations",
        "needed": [
            "Design liquidation avoidance as hard objective, not optional safeguard.",
            "Include emergency unwind runbook and adverse move handling policy.",
            "Model liquidation penalties in stress tests and downside attribution.",
        ],
    },
    {
        "name": "drift_borrow_lend.md",
        "title": "Drift Borrow and Lend",
        "url": "https://docs.drift.trade/protocol/borrow-lend",
        "needed": [
            "Use USDC lending as baseline carry for risk-off strategy state.",
            "Include utilization-sensitive borrow costs in net edge computation.",
            "Avoid borrow-driven loops and keep conservative collateral policy.",
        ],
    },
    {
        "name": "ranger_strategy_setup_guide.md",
        "title": "Ranger Strategy Setup Guide",
        "url": "https://docs.ranger.finance/vault-owners/strategies/setup-guide",
        "needed": [
            "Follow setup sequence for strategy account creation and adaptor wiring.",
            "Translate guide steps into deterministic deployment checklist for repo.",
            "Use this as one source of truth for manager initialization flow.",
        ],
    },
    {
        "name": "ranger_bots_and_scripts.md",
        "title": "Ranger Bots and Scripts",
        "url": "https://docs.ranger.finance/vault-owners/operations/bots-and-scripts",
        "needed": [
            "Build loop architecture for rebalancing, monitoring, and maintenance tasks.",
            "Document retry policy, health checks, and operational incident response.",
            "Use automation guidance to prove production readiness to judges.",
        ],
    },
    {
        "name": "ranger_deployed_programs.md",
        "title": "Ranger Deployed Programs",
        "url": "https://docs.ranger.finance/security/deployed-programs",
        "needed": [
            "Use canonical mainnet addresses for vault and adaptor program interactions.",
            "Include addresses in strategy docs and scripts for verifiable deployment.",
            "Cross-check program IDs during integration and submission packaging.",
        ],
    },
    {
        "name": "ranger_audits.md",
        "title": "Ranger Security Audits",
        "url": "https://docs.ranger.finance/security/audits",
        "needed": [
            "Reference published audits to support technical implementation credibility.",
            "Separate protocol-level security assumptions from strategy-specific risks clearly.",
            "Link reports directly in submission strategy and risk documents.",
        ],
    },
    {
        "name": "cobo_api_docs.md",
        "title": "Cobo API Documentation",
        "url": "https://www.cobo.com/developers/v2/developer-tools/cobo-cli/api-documentation",
        "needed": [
            "Use only for optional CEX verification or execution support workflows.",
            "Prepare read-only API evidence package if cross-venue logic is enabled.",
            "Define credential boundaries and operational security controls.",
        ],
    },
]


def clean_text(text: str) -> str:
    text = text.replace("\x00", "")
    text = text.replace("\u00ad", "")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def convert_papers() -> list[str]:
    created_files: list[str] = []
    if not os.path.isdir(PAPERS_DIR):
        return created_files

    for entry in sorted(os.listdir(PAPERS_DIR)):
        if not entry.lower().endswith(".pdf"):
            continue

        paper_id = entry[:-4]
        title = PAPER_TITLES.get(paper_id, paper_id)
        pdf_path = os.path.join(PAPERS_DIR, entry)
        md_path = os.path.join(PAPERS_DIR, f"{paper_id}.md")

        parts: list[str] = []
        try:
            reader = PdfReader(pdf_path)
            for index, page in enumerate(reader.pages, start=1):
                extracted = clean_text(page.extract_text() or "")
                if extracted:
                    parts.append(f"## Page {index}\n\n{extracted}\n")
                else:
                    parts.append(f"## Page {index}\n\nNo extractable text found on this page.\n")
            extracted_markdown = "\n".join(parts)
        except Exception as error:
            extracted_markdown = f"Failed to convert PDF to markdown text. Error: {error}"

        content = (
            f"# {title}\n\n"
            f"- Source PDF: ./{entry}\n"
            f"- arXiv URL: https://arxiv.org/abs/{paper_id}\n\n"
            f"## Full Extracted Content\n\n{extracted_markdown}\n"
        )
        with open(md_path, "w", encoding="utf-8") as file:
            file.write(content)
        created_files.append(md_path)

    readme_lines = [
        "# Papers Folder",
        "",
        "This folder contains original PDFs and markdown conversions for each paper.",
        "",
        "## Converted Markdown Files",
        "",
    ]
    for entry in sorted(os.listdir(PAPERS_DIR)):
        if entry.lower().endswith(".md") and entry.lower() != "readme.md":
            paper_id = entry[:-3]
            title = PAPER_TITLES.get(paper_id, paper_id)
            readme_lines.append(f"- [{title}](./{entry})")
    readme_lines.append("")

    readme_path = os.path.join(PAPERS_DIR, "README.md")
    with open(readme_path, "w", encoding="utf-8") as file:
        file.write("\n".join(readme_lines))
    created_files.append(readme_path)
    return created_files


def html_to_markdown(url: str, session: requests.Session) -> str:
    response = session.get(url, timeout=60)
    response.raise_for_status()

    content_type = (response.headers.get("content-type") or "").lower()
    if url.endswith("llms.txt") or "text/plain" in content_type:
        return response.text.strip()

    soup = BeautifulSoup(response.text, "html.parser")
    for node in soup(["script", "style", "noscript", "svg"]):
        node.decompose()

    body = soup.find("main") or soup.find("article") or soup.find("body") or soup
    rendered = markdownify(str(body), heading_style="ATX")
    rendered = rendered.replace("\r\n", "\n")
    rendered = re.sub(r"\n{3,}", "\n\n", rendered)
    return rendered.strip()


def build_docs() -> list[str]:
    os.makedirs(DOCS_DIR, exist_ok=True)
    created_files: list[str] = []
    session = requests.Session()
    session.headers.update({"User-Agent": "Mozilla/5.0 (compatible; BuildABearCollector/1.0)"})

    for spec in DOC_SPECS:
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        try:
            extracted = html_to_markdown(spec["url"], session)
            fetch_status = "ok"
        except Exception as error:
            extracted = f"Failed to fetch page content. Error: {error}"
            fetch_status = "error"

        needed_block = "\n".join([f"- {item}" for item in spec["needed"]])
        content = (
            f"# {spec['title']}\n\n"
            f"- Source URL: {spec['url']}\n"
            f"- Retrieved At: {timestamp}\n"
            f"- Fetch Status: {fetch_status}\n\n"
            f"## Highlighted Requirements For This Project\n\n{needed_block}\n\n"
            f"## Full Documentation Capture\n\n{extracted}\n"
        )

        doc_path = os.path.join(DOCS_DIR, spec["name"])
        with open(doc_path, "w", encoding="utf-8") as file:
            file.write(content)
        created_files.append(doc_path)

    index_lines = [
        "# External Docs Pack",
        "",
        "This directory stores long markdown captures of requested source pages.",
        "",
        "## Files",
        "",
    ]
    for spec in DOC_SPECS:
        index_lines.append(f"- [{spec['title']}](./{spec['name']})")
    index_lines.append("")

    readme_path = os.path.join(DOCS_DIR, "README.md")
    with open(readme_path, "w", encoding="utf-8") as file:
        file.write("\n".join(index_lines))
    created_files.append(readme_path)
    return created_files


def main() -> None:
    paper_files = convert_papers()
    doc_files = build_docs()
    print(f"Converted paper files: {len(paper_files)}")
    print(f"Generated doc files: {len(doc_files)}")


if __name__ == "__main__":
    main()
