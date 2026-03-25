from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, Iterable, List

import json
import math
import time

import numpy as np
import requests


FUTURES_BASE_URL = "https://fapi.binance.com"
SPOT_BASE_URL = "https://api.binance.com"


def interval_to_milliseconds(interval_hours: int) -> int:
    return max(1, interval_hours) * 60 * 60 * 1000


def market_to_symbol(market: str) -> str:
    mapping = {
        "BTC-PERP": "BTCUSDT",
        "ETH-PERP": "ETHUSDT",
        "SOL-PERP": "SOLUSDT",
    }
    return mapping.get(market, market.replace("-PERP", "USDT"))


def _to_iso(timestamp_ms: int) -> str:
    return datetime.fromtimestamp(timestamp_ms / 1000, tz=timezone.utc).isoformat().replace("+00:00", "Z")


def _rolling_std(values: List[float], window: int) -> float:
    if not values:
        return 0.0
    series = values[-window:]
    return float(np.std(np.array(series, dtype=float))) if series else 0.0


def _load_jsonl(path: Path) -> List[Dict[str, float | str]]:
    if not path.exists():
        return []
    rows: List[Dict[str, float | str]] = []
    with path.open("r", encoding="utf-8") as file:
        for line in file:
            stripped = line.strip()
            if stripped:
                rows.append(json.loads(stripped))
    return rows


def _save_jsonl(path: Path, rows: Iterable[Dict[str, float | str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as file:
        for row in rows:
            file.write(json.dumps(row) + "\n")


def assemble_rows_from_market_series(
    market: str,
    futures_klines: List[List[object]],
    spot_klines: List[List[object]],
    funding_rates: List[Dict[str, object]],
    open_interest_history: List[Dict[str, object]],
) -> List[Dict[str, float | str]]:
    if not futures_klines or not spot_klines:
        return []

    spot_map: Dict[int, List[object]] = {int(candle[0]): candle for candle in spot_klines}
    common_times = sorted([int(candle[0]) for candle in futures_klines if int(candle[0]) in spot_map])
    if not common_times:
        return []

    funding_sorted = sorted(
        [
            {
                "fundingTime": int(item["fundingTime"]),
                "fundingRate": float(item["fundingRate"]),
            }
            for item in funding_rates
        ],
        key=lambda item: item["fundingTime"],
    )

    oi_sorted = sorted(
        [
            {
                "timestamp": int(item["timestamp"]),
                "sumOpenInterestValue": float(item.get("sumOpenInterestValue", 0.0)),
            }
            for item in open_interest_history
            if "timestamp" in item
        ],
        key=lambda item: item["timestamp"],
    )

    funding_idx = 0
    oi_idx = 0
    previous_close = None
    returns: List[float] = []
    rows: List[Dict[str, float | str]] = []

    futures_map: Dict[int, List[object]] = {int(candle[0]): candle for candle in futures_klines}

    for timestamp in common_times:
        futures = futures_map[timestamp]
        spot = spot_map[timestamp]

        while funding_idx + 1 < len(funding_sorted) and funding_sorted[funding_idx + 1]["fundingTime"] <= timestamp:
            funding_idx += 1

        while oi_idx + 1 < len(oi_sorted) and oi_sorted[oi_idx + 1]["timestamp"] <= timestamp:
            oi_idx += 1

        futures_close = float(futures[4])
        spot_close = float(spot[4])
        if spot_close <= 0:
            continue

        basis_bps = (futures_close - spot_close) / spot_close * 10_000
        mark_oracle_divergence_bps = abs(basis_bps)

        high = float(futures[2])
        low = float(futures[3])
        spread_proxy = max(0.5, abs(high - low) / max(futures_close, 1e-9) * 10_000 * 0.1)

        quote_volume = float(futures[7])
        open_interest = (
            oi_sorted[oi_idx]["sumOpenInterestValue"]
            if oi_sorted and oi_idx < len(oi_sorted)
            else max(quote_volume * 0.5, 1_000_000)
        )

        if previous_close is None:
            ret = 0.0
        else:
            ret = math.log(max(futures_close, 1e-9) / max(previous_close, 1e-9))
        previous_close = futures_close
        returns.append(ret)

        volatility_1h = abs(ret)
        volatility_24h = _rolling_std(returns, 24)

        if funding_sorted:
            funding_rate_hourly = funding_sorted[funding_idx]["fundingRate"] / 8.0
        else:
            funding_rate_hourly = 0.0

        utilization = min(0.98, max(0.2, 0.55 + mark_oracle_divergence_bps / 200 + volatility_24h * 3))
        lend_apy = min(0.25, max(0.02, 0.05 + abs(funding_rate_hourly) * 24 * 365.25 * 0.1))
        borrow_apy = min(0.35, max(lend_apy + 0.01, lend_apy + 0.02 + utilization * 0.08))
        execution_cost_bps = min(50.0, spread_proxy + volatility_24h * 10_000 * 0.03)

        rows.append(
            {
                "timestamp": _to_iso(timestamp),
                "market": market,
                "funding_rate_hourly": float(funding_rate_hourly),
                "basis_bps": float(basis_bps),
                "mark_oracle_divergence_bps": float(mark_oracle_divergence_bps),
                "bid_ask_spread_bps": float(spread_proxy),
                "volume_1h": float(max(quote_volume, 0.0)),
                "open_interest": float(max(open_interest, 0.0)),
                "volatility_1h": float(max(volatility_1h, 0.0)),
                "volatility_24h": float(max(volatility_24h, 0.0)),
                "lend_apy": float(lend_apy),
                "borrow_apy": float(borrow_apy),
                "utilization": float(utilization),
                "estimated_execution_cost_bps": float(max(execution_cost_bps, 0.0)),
            }
        )

    return rows


@dataclass
class BinanceDatasetConfig:
    markets: List[str]
    years: int
    interval_hours: int
    cache_path: str
    use_cache: bool = True
    request_timeout_seconds: int = 30
    seed_fallback: int = 42


class BinanceHistoricalDataClient:
    def __init__(self, request_timeout_seconds: int = 30) -> None:
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": "BuildABearMLPipeline/1.0"})
        self.request_timeout_seconds = request_timeout_seconds

    def _request_json(self, url: str, params: Dict[str, object]) -> List[object] | Dict[str, object]:
        response = self.session.get(url, params=params, timeout=self.request_timeout_seconds)
        response.raise_for_status()
        return response.json()

    def _fetch_paginated_klines(
        self,
        base_url: str,
        symbol: str,
        start_ms: int,
        end_ms: int,
        interval_hours: int,
        limit: int = 1500,
    ) -> List[List[object]]:
        interval_ms = interval_to_milliseconds(interval_hours)
        cursor = start_ms
        output: List[List[object]] = []

        while cursor < end_ms:
            payload = self._request_json(
                f"{base_url}/fapi/v1/klines" if base_url == FUTURES_BASE_URL else f"{base_url}/api/v3/klines",
                {
                    "symbol": symbol,
                    "interval": "1h",
                    "startTime": cursor,
                    "endTime": end_ms,
                    "limit": limit,
                },
            )
            data = payload if isinstance(payload, list) else []
            if not data:
                break

            output.extend(data)
            next_cursor = int(data[-1][0]) + interval_ms
            if next_cursor <= cursor:
                break
            cursor = next_cursor

            if len(data) < limit:
                if cursor >= end_ms:
                    break
            time.sleep(0.02)

        return output

    def _fetch_funding_rates(self, symbol: str, start_ms: int, end_ms: int, limit: int = 1000) -> List[Dict[str, object]]:
        cursor = start_ms
        output: List[Dict[str, object]] = []
        while cursor < end_ms:
            payload = self._request_json(
                f"{FUTURES_BASE_URL}/fapi/v1/fundingRate",
                {
                    "symbol": symbol,
                    "startTime": cursor,
                    "endTime": end_ms,
                    "limit": limit,
                },
            )
            data = payload if isinstance(payload, list) else []
            if not data:
                break

            mapped = [
                {
                    "fundingTime": int(item["fundingTime"]),
                    "fundingRate": float(item["fundingRate"]),
                }
                for item in data
            ]
            output.extend(mapped)
            next_cursor = int(data[-1]["fundingTime"]) + 1
            if next_cursor <= cursor:
                break
            cursor = next_cursor

            if len(data) < limit and cursor >= end_ms:
                break
            time.sleep(0.02)

        return output

    def _fetch_open_interest_history(
        self,
        symbol: str,
        start_ms: int,
        end_ms: int,
        interval_hours: int,
        limit: int = 500,
    ) -> List[Dict[str, object]]:
        cursor = start_ms
        interval_ms = interval_to_milliseconds(interval_hours)
        output: List[Dict[str, object]] = []

        while cursor < end_ms:
            try:
                payload = self._request_json(
                    f"{FUTURES_BASE_URL}/futures/data/openInterestHist",
                    {
                        "symbol": symbol,
                        "period": "1h",
                        "startTime": cursor,
                        "endTime": end_ms,
                        "limit": limit,
                    },
                )
            except requests.HTTPError:
                break

            data = payload if isinstance(payload, list) else []
            if not data:
                break

            output.extend(data)
            next_cursor = int(data[-1]["timestamp"]) + interval_ms
            if next_cursor <= cursor:
                break
            cursor = next_cursor

            if len(data) < limit and cursor >= end_ms:
                break
            time.sleep(0.02)

        return output

    def fetch_market_rows(
        self,
        market: str,
        start_ms: int,
        end_ms: int,
        interval_hours: int,
    ) -> List[Dict[str, float | str]]:
        symbol = market_to_symbol(market)
        futures_klines = self._fetch_paginated_klines(
            FUTURES_BASE_URL,
            symbol,
            start_ms,
            end_ms,
            interval_hours,
        )
        spot_klines = self._fetch_paginated_klines(
            SPOT_BASE_URL,
            symbol,
            start_ms,
            end_ms,
            interval_hours,
        )
        funding_rates = self._fetch_funding_rates(symbol, start_ms, end_ms)
        open_interest = self._fetch_open_interest_history(symbol, start_ms, end_ms, interval_hours)

        return assemble_rows_from_market_series(
            market=market,
            futures_klines=futures_klines,
            spot_klines=spot_klines,
            funding_rates=funding_rates,
            open_interest_history=open_interest,
        )

    def fetch_dataset(self, config: BinanceDatasetConfig) -> List[Dict[str, float | str]]:
        cache_file = Path(config.cache_path)
        if config.use_cache and cache_file.exists():
            cached = _load_jsonl(cache_file)
            if cached:
                return cached

        end = datetime.now(timezone.utc)
        start = end - timedelta(days=int(365.25 * max(1, config.years)))
        start_ms = int(start.timestamp() * 1000)
        end_ms = int(end.timestamp() * 1000)

        rows: List[Dict[str, float | str]] = []
        for market in config.markets:
            rows.extend(self.fetch_market_rows(market, start_ms, end_ms, config.interval_hours))

        rows.sort(key=lambda row: (str(row["timestamp"]), str(row["market"])))
        _save_jsonl(cache_file, rows)
        return rows
