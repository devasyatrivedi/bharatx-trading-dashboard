"""
BharatX Market Data Service — Flask HTTP server
Serves NSE stock quotes via yfinance for the Express API to proxy.

Endpoints:
  GET /stocks                    — full NSE stock master list (no prices)
  GET /stocks/sectors            — list of all sectors
  GET /quotes?symbols=SYM1,SYM2 — live quotes for given Yahoo symbols (max 20)
  GET /quotes/batch?sector=IT    — all stocks in a sector with live quotes
  GET /search?q=tata             — fuzzy search by name/symbol

Run: python3 market_server.py [--port 5001]
"""

import argparse
import json
import logging
import threading
import time
from functools import lru_cache
from flask import Flask, request, jsonify
from flask_cors import CORS
import yfinance as yf

from nse_stocks import NSE_STOCKS, STOCK_MAP, SECTORS

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("market-server")

app = Flask(__name__)
CORS(app)

# ─── Price Cache ──────────────────────────────────────────────────────────────
# Simple in-memory cache: symbol → {price, change_pct, volume, market_cap, last_updated}
_price_cache: dict[str, dict] = {}
_cache_lock = threading.Lock()
CACHE_TTL_SECONDS = 60   # refresh quotes every 60 seconds max


def fetch_quotes(symbols: list[str]) -> dict[str, dict]:
    """
    Fetch live quotes for a batch of symbols using yf.download() —
    single HTTP request for all symbols, much faster than per-ticker calls.
    """
    if not symbols:
        return {}

    result = {}
    now = int(time.time())

    # Separate normal tickers from indices (indices use different Yahoo format)
    normal = [s for s in symbols if not s.startswith("^")]
    indices = [s for s in symbols if s.startswith("^")]

    def parse_batch(syms: list[str]):
        if not syms:
            return
        try:
            # Download last 2 trading days to compute daily change
            raw = yf.download(
                tickers=" ".join(syms),
                period="2d",
                interval="1d",
                group_by="ticker",
                auto_adjust=True,
                progress=False,
                threads=True,
            )
            if raw is None or raw.empty:
                return

            for sym in syms:
                try:
                    name, sector = STOCK_MAP.get(sym, (sym.replace(".NS", "").replace("^", ""), "Index"))
                    # For single symbol, df is flat; for multiple, df is multi-level
                    if len(syms) == 1:
                        df = raw
                    else:
                        if sym not in raw.columns.get_level_values(0):
                            continue
                        df = raw[sym]

                    if df is None or df.empty or len(df) < 1:
                        continue

                    # Latest close
                    close_col = "Close"
                    if close_col not in df.columns:
                        continue

                    closes = df[close_col].dropna()
                    if len(closes) < 1:
                        continue

                    price = float(closes.iloc[-1])
                    prev  = float(closes.iloc[-2]) if len(closes) >= 2 else price
                    change_pct = ((price - prev) / prev * 100) if prev > 0 else 0.0

                    volume = 0
                    if "Volume" in df.columns:
                        vols = df["Volume"].dropna()
                        volume = int(vols.iloc[-1]) if len(vols) > 0 else 0

                    result[sym] = {
                        "symbol":        sym,
                        "displaySymbol": sym.replace(".NS", "").replace("^", ""),
                        "name":          name,
                        "sector":        sector,
                        "price":         round(price, 2),
                        "prevClose":     round(prev, 2),
                        "changePct":     round(change_pct, 4),
                        "volume":        volume,
                        "marketCap":     0,
                        "currency":      "INR",
                        "exchange":      "NSE",
                        "lastUpdated":   now,
                    }
                except Exception as e:
                    log.debug("Parse error for %s: %s", sym, e)
        except Exception as e:
            log.error("Batch download error: %s", e)

    # Fetch in chunks of 20 to avoid Yahoo throttling
    CHUNK = 20
    for i in range(0, len(normal), CHUNK):
        parse_batch(normal[i:i + CHUNK])
    for idx in indices:
        parse_batch([idx])

    return result


def get_cached_quotes(symbols: list[str]) -> dict[str, dict]:
    """Return cached quotes, fetching stale/missing ones."""
    now = int(time.time())
    stale = [s for s in symbols
             if s not in _price_cache
             or now - _price_cache[s].get("lastUpdated", 0) > CACHE_TTL_SECONDS]

    if stale:
        fresh = fetch_quotes(stale)
        with _cache_lock:
            _price_cache.update(fresh)

    return {s: _price_cache[s] for s in symbols if s in _price_cache}


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route("/stocks", methods=["GET"])
def list_stocks():
    """Return the full NSE stock master list without live prices."""
    sector_filter = request.args.get("sector")
    stocks = [
        {
            "symbol":        sym,
            "displaySymbol": sym.replace(".NS", ""),
            "name":          name,
            "sector":        sector,
        }
        for sym, name, sector in NSE_STOCKS
        if not sector_filter or sector.lower() == sector_filter.lower()
    ]
    return jsonify({"stocks": stocks, "total": len(stocks)})


@app.route("/stocks/sectors", methods=["GET"])
def list_sectors():
    """Return all sectors."""
    return jsonify({"sectors": SECTORS})


@app.route("/quotes", methods=["GET"])
def get_quotes():
    """
    GET /quotes?symbols=RELIANCE.NS,TCS.NS
    Returns live quotes for up to 20 symbols.
    """
    raw = request.args.get("symbols", "")
    if not raw:
        return jsonify({"error": "symbols param required"}), 400

    symbols = [s.strip() for s in raw.split(",") if s.strip()][:20]
    quotes = get_cached_quotes(symbols)

    return jsonify({"quotes": list(quotes.values()), "count": len(quotes)})


@app.route("/quotes/batch", methods=["GET"])
def get_sector_quotes():
    """
    GET /quotes/batch?sector=IT&limit=20
    Returns live quotes for all stocks in a sector.
    """
    sector = request.args.get("sector", "").strip()
    limit  = min(int(request.args.get("limit", 20)), 50)

    if sector:
        symbols = [sym for sym, _, sec in NSE_STOCKS if sec.lower() == sector.lower()][:limit]
    else:
        symbols = [sym for sym, _, _ in NSE_STOCKS][:limit]

    quotes = get_cached_quotes(symbols)

    # Sort by abs change_pct descending (most active)
    sorted_quotes = sorted(quotes.values(), key=lambda q: abs(q.get("changePct", 0)), reverse=True)
    return jsonify({"quotes": sorted_quotes, "count": len(sorted_quotes), "sector": sector or "all"})


@app.route("/search", methods=["GET"])
def search_stocks():
    """
    GET /search?q=tata&limit=10
    Fuzzy search by display name or symbol.
    """
    q     = request.args.get("q", "").lower().strip()
    limit = min(int(request.args.get("limit", 10)), 30)

    if not q:
        return jsonify({"results": []})

    results = []
    for sym, name, sector in NSE_STOCKS:
        if q in sym.lower() or q in name.lower():
            results.append({
                "symbol":        sym,
                "displaySymbol": sym.replace(".NS", ""),
                "name":          name,
                "sector":        sector,
            })
        if len(results) >= limit:
            break

    return jsonify({"results": results, "count": len(results)})


@app.route("/healthz", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "market-data", "stocks": len(NSE_STOCKS)})


# ─── Entry Point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=5000)
    parser.add_argument("--host", default="0.0.0.0")
    args = parser.parse_args()

    log.info("BharatX Market Data Service starting on %s:%d", args.host, args.port)
    log.info("NSE stock universe: %d stocks across %d sectors", len(NSE_STOCKS), len(SECTORS))

    app.run(host=args.host, port=args.port, debug=False, threaded=True, use_reloader=False)
