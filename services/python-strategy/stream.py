"""
BharatX Stream — Binance WebSocket price feed → strategy → API

Usage:
    python3 stream.py [--symbol BTCUSDT] [--interval 1m] [--api http://localhost:80/api]

The script:
  1. Connects to Binance WebSocket kline stream
  2. Accumulates candles into a rolling DataFrame
  3. On each closed candle, runs BharatXStrategy
  4. POSTs non-NEUTRAL signals to the Express API
  5. Also opens a persistent WebSocket to the Node server for real-time push
"""

import asyncio
import websockets
import json
import requests
import argparse
import logging
from datetime import datetime
import pandas as pd

from strategy import BharatXStrategy, StrategyConfig

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("bharatx-stream")


# ─── Config ──────────────────────────────────────────────────────────────────

def parse_args():
    p = argparse.ArgumentParser(description="BharatX Binance Stream")
    p.add_argument("--symbol",   default="BTCUSDT",               help="Trading pair (default: BTCUSDT)")
    p.add_argument("--interval", default="1m",                    help="Kline interval (default: 1m)")
    p.add_argument("--api",      default="http://localhost:80/api",help="Express API base URL")
    p.add_argument("--ws",       default="ws://localhost:80/ws",   help="Express WebSocket URL for live push")
    p.add_argument("--all",      action="store_true",              help="Post all signals (including NEUTRAL)")
    return p.parse_args()


# ─── Data Store ──────────────────────────────────────────────────────────────

MAX_CANDLES = 300   # keep enough history for EMA-200 + buffer

candles: list[dict] = []


def append_candle(k: dict):
    """Parse a Binance kline payload and append to the rolling buffer."""
    candle = {
        "timestamp": pd.to_datetime(k["t"], unit="ms", utc=True),
        "open":   float(k["o"]),
        "high":   float(k["h"]),
        "low":    float(k["l"]),
        "close":  float(k["c"]),
        "volume": float(k["v"]),
    }

    # Replace the last candle if same timestamp (live update), else append
    if candles and candles[-1]["timestamp"] == candle["timestamp"]:
        candles[-1] = candle
    else:
        candles.append(candle)

    # Rolling window — keep last MAX_CANDLES candles
    if len(candles) > MAX_CANDLES:
        candles.pop(0)


def to_dataframe() -> pd.DataFrame:
    df = pd.DataFrame(candles)
    df.set_index("timestamp", inplace=True)
    return df


# ─── API Helpers ─────────────────────────────────────────────────────────────

def post_signal(api_base: str, signal_dict: dict) -> bool:
    """POST a signal to the Express API. Returns True on success."""
    url = f"{api_base}/signals"
    try:
        resp = requests.post(url, json={
            "symbol":       signal_dict["symbol"],
            "direction":    signal_dict["direction"],
            "totalScore":   signal_dict["totalScore"],
            "engines":      signal_dict["engines"],
            "price":        signal_dict["price"],
            "atr":          signal_dict.get("atr"),
            "stopLoss":     signal_dict.get("stopLoss"),
            "takeProfit":   signal_dict.get("takeProfit"),
            "ema200Status": signal_dict.get("ema200Status"),
            "inSession":    signal_dict.get("inSession", True),
        }, timeout=5)
        if resp.status_code == 201:
            log.info("Signal posted ✓  %s  dir=%s  score=%s",
                     signal_dict["symbol"], signal_dict["direction"], signal_dict["totalScore"])
            return True
        else:
            log.warning("API returned %s: %s", resp.status_code, resp.text[:200])
            return False
    except Exception as e:
        log.error("Failed to POST signal: %s", e)
        return False


# ─── WebSocket Push ───────────────────────────────────────────────────────────

ws_node_conn = None   # shared persistent connection to Node WS


async def connect_to_node(ws_url: str):
    """Maintain a persistent WebSocket connection to the Node server."""
    global ws_node_conn
    while True:
        try:
            async with websockets.connect(ws_url, ping_interval=20, ping_timeout=10) as ws:
                ws_node_conn = ws
                log.info("Connected to Node WS at %s", ws_url)
                # Keep alive until disconnected
                await ws.wait_closed()
        except Exception as e:
            log.warning("Node WS disconnected (%s), retrying in 5s...", e)
            ws_node_conn = None
        await asyncio.sleep(5)


async def push_to_node(signal_dict: dict):
    """Send signal dict over the persistent WS connection if available."""
    global ws_node_conn
    if ws_node_conn and not ws_node_conn.closed:
        try:
            await ws_node_conn.send(json.dumps(signal_dict))
            log.debug("Pushed signal to Node WS")
        except Exception as e:
            log.warning("WS push failed: %s", e)


# ─── Main Stream ─────────────────────────────────────────────────────────────

async def stream(args, strategy: BharatXStrategy):
    symbol_lower = args.symbol.lower()
    url = f"wss://stream.binance.com:9443/ws/{symbol_lower}@kline_{args.interval}"

    log.info("Connecting to Binance stream: %s", url)

    last_signal_direction = None   # debounce — only post when direction changes

    async with websockets.connect(url, ping_interval=20) as ws:
        log.info("Connected to Binance (%s %s)", args.symbol, args.interval)
        async for raw in ws:
            msg = json.loads(raw)
            k = msg.get("k", {})

            # Only process closed candles (k.x == true) for signal generation
            # But always update the last candle for live price
            append_candle(k)

            if not k.get("x", False):
                # Candle still open — update live price display only
                continue

            log.debug("Candle closed: close=%.4f", float(k["c"]))

            if len(candles) < 205:
                log.info("Warming up... %d / 205 candles", len(candles))
                continue

            df = to_dataframe()
            signal = strategy.generate(df)

            if signal is None:
                continue

            sig_dict = signal.to_dict()
            direction = sig_dict["direction"]
            score = sig_dict["totalScore"]

            log.info(
                "SIGNAL %-8s  dir=%-7s  score=%+d  price=%.4f  sl=%.4f  tp=%.4f  ema200=%s",
                sig_dict["symbol"], direction, score,
                sig_dict["price"], sig_dict["stopLoss"], sig_dict["takeProfit"],
                sig_dict["ema200Status"],
            )

            # Engine breakdown
            for eng in sig_dict["engines"]:
                log.info("  %-12s  %-4s  %+d", eng["name"], eng["status"], eng["score"])

            # Post to API: post all if --all flag, otherwise only non-NEUTRAL or direction changes
            should_post = args.all or direction != "NEUTRAL" or direction != last_signal_direction
            if should_post:
                post_signal(args.api, sig_dict)
                last_signal_direction = direction

            # Push to Node WS
            await push_to_node(sig_dict)


# ─── Entry Point ─────────────────────────────────────────────────────────────

async def main():
    args = parse_args()

    config = StrategyConfig()
    strategy = BharatXStrategy(config=config, symbol=args.symbol)

    log.info("BharatX Strategy Engine started")
    log.info("  Symbol   : %s", args.symbol)
    log.info("  Interval : %s", args.interval)
    log.info("  API      : %s", args.api)
    log.info("  WS       : %s", args.ws)
    log.info("  Engines  : EMA(%d/%d) ST(%d,%.1f) MACD(%d/%d/%d) UT(%.1f) VWAP GANN(%d)",
             config.ema_fast, config.ema_slow,
             config.st_len, config.st_factor,
             config.macd_fast, config.macd_slow, config.macd_signal,
             config.ut_sensitive, config.gann_lookback)

    # Run the Node WS connection in background and the Binance stream together
    await asyncio.gather(
        connect_to_node(args.ws),
        stream(args, strategy),
    )


if __name__ == "__main__":
    asyncio.run(main())
