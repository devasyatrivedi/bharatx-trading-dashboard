# BharatX Python Strategy Engine

Converts the BharatXGann Pine Script strategy into a live Python engine that
streams Binance price data, runs all 6 engines, and pushes signals to the
Node.js API.

## Architecture

```
Binance WebSocket (BTC/USDT klines)
        │
        ▼
  stream.py (price feed consumer)
        │
        ├── rolling DataFrame (last 300 candles)
        │
        ▼
  strategy.py (BharatXStrategy)
    ├─ Engine 1: EMA Crossover (fast=8, slow=21)
    ├─ Engine 2: Supertrend   (ATR 10, factor 3.0)
    ├─ Engine 3: MACD MTF     (12/26/9 + EMA-50 filter)
    ├─ Engine 4: UT Bot       (ATR trailing stop)
    ├─ Engine 5: VWAP Bias    (price vs VWAP)
    └─ Engine 6: Gann 50%     (mid of 50-bar H/L range)
        │
        ▼
  Confluence Score (sum of votes)
  totalScore >= 3  → LONG
  totalScore <= -3 → SHORT
  otherwise        → NEUTRAL
        │
        ├── POST /api/signals  (persists to PostgreSQL)
        └── WS  /ws            (real-time push to frontend)
```

## Usage

```bash
# Default: BTCUSDT 1-minute candles
python3 stream.py

# Custom symbol and interval
python3 stream.py --symbol ETHUSDT --interval 5m

# Custom API URL (if running locally without proxy)
python3 stream.py --api http://localhost:8080/api --ws ws://localhost:8080/ws

# Post all signals including NEUTRAL
python3 stream.py --all
```

## Configuration

Edit `StrategyConfig` in `strategy.py` to change:
- `long_thresh` / `short_thresh` — confluence score threshold (default: 3)
- `ema_fast` / `ema_slow` — EMA periods (default: 8 / 21)
- `st_factor` — Supertrend multiplier (default: 3.0)
- `atr_mult` / `rr_ratio` — stop-loss and take-profit sizing
- Engine weights (1-3) to give more importance to specific engines

## Notes

- Needs at least 205 candles before generating signals (EMA-200 warmup)
- At 1m intervals, warmup takes ~3.5 minutes from cold start
- Paper trading only — no real order execution
