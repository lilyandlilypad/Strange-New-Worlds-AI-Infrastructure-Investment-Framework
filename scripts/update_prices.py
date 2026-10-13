#!/usr/bin/env python3
"""Refresh Yahoo Finance adjusted-close history for the project's public tiers."""

import json
import time
import urllib.error
import urllib.request
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.parse import quote


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "price-history.json"
DAY_ONE = date(2026, 10, 12)
DAY_ONE_EPOCH = int(datetime.combine(DAY_ONE, datetime.min.time(), timezone.utc).timestamp())
COMPANIES = {
    "NVDA": {"name": "NVIDIA", "tier": "core"},
    "TSM": {"name": "TSMC", "tier": "core"},
    "QCOM": {"name": "Qualcomm", "tier": "core"},
    "AAPL": {"name": "Apple", "tier": "core"},
    "005930.KS": {"name": "Samsung Electronics", "tier": "expanded"},
    "AMD": {"name": "AMD", "tier": "expanded"},
    "INTC": {"name": "Intel", "tier": "expanded"},
    "AVGO": {"name": "Broadcom", "tier": "expanded"},
    "GOOGL": {"name": "Alphabet / Google", "tier": "app"},
    "AMZN": {"name": "Amazon", "tier": "app"},
}


def fetch_history(symbol):
    end_epoch = int(time.time()) + 86_400
    url = (
        f"https://query1.finance.yahoo.com/v8/finance/chart/{quote(symbol, safe='.')}"
        f"?period1={DAY_ONE_EPOCH}&period2={end_epoch}&interval=1d&events=div%2Csplits"
    )
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (compatible; InvestmentFramework/1.0)"},
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            payload = json.load(response)
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
        raise RuntimeError(f"Could not fetch Yahoo Finance history for {symbol}: {error}") from error

    chart = payload.get("chart", {})
    if chart.get("error"):
        raise RuntimeError(f"Yahoo Finance returned an error for {symbol}: {chart['error']}")
    results = chart.get("result")
    if not results:
        raise RuntimeError(f"Yahoo Finance returned no history for {symbol}.")

    result = results[0]
    timestamps = result.get("timestamp") or []
    indicators = result.get("indicators", {})
    quotes = indicators.get("quote") or [{}]
    closes = quotes[0].get("close") or []
    adjusted_sets = indicators.get("adjclose") or []
    adjusted = adjusted_sets[0].get("adjclose") if adjusted_sets else None
    prices = adjusted or closes
    points = []
    for timestamp, price in zip(timestamps, prices):
        if price is not None:
            points.append({
                "date": datetime.fromtimestamp(timestamp, timezone.utc).date().isoformat(),
                "adjustedClose": round(float(price), 6),
            })
    if not points or points[0]["date"] != DAY_ONE.isoformat():
        raise RuntimeError(
            f"{symbol} has no Yahoo Finance closing price for Day 1 ({DAY_ONE.isoformat()}); "
            "history was not updated."
        )
    if any(points[index]["date"] >= points[index + 1]["date"] for index in range(len(points) - 1)):
        raise RuntimeError(f"Yahoo Finance returned out-of-order history for {symbol}.")

    metadata = result.get("meta", {})
    return {
        **COMPANIES[symbol],
        "currency": metadata.get("currency", "Unknown"),
        "source": f"https://finance.yahoo.com/quote/{quote(symbol, safe='.')}/history/",
        "points": points,
    }


def main():
    securities = {symbol: fetch_history(symbol) for symbol in COMPANIES}
    payload = {
        "dayOne": DAY_ONE.isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "priceBasis": "Yahoo Finance adjusted close when available",
        "securities": securities,
    }
    temporary_output = OUTPUT.with_suffix(".json.tmp")
    temporary_output.write_text(json.dumps(payload, indent=2) + "\n")
    temporary_output.replace(OUTPUT)
    print(f"Updated {OUTPUT.name} with history for {len(securities)} publicly traded companies.")
    print(f"Day 1: {DAY_ONE.isoformat()} | Last data refresh: {payload['updatedAt']}")


if __name__ == "__main__":
    main()
