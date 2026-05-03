"""
BharatX Multi-Engine Strategy — Python implementation
Converted from Pine Script v6 (BharatXGann by Devasya)

6 engines:
  1. EMA Crossover
  2. Supertrend (ATR-based)
  3. MACD Multi-Timeframe
  4. UT Bot Trailing Stop
  5. VWAP Bias
  6. Gann 50% Reversion

Each engine votes +weight (BULL) or -weight (BEAR).
totalScore >= longThresh  → LONG signal
totalScore <= -shortThresh → SHORT signal
"""

import numpy as np
import pandas as pd
from dataclasses import dataclass, field
from typing import Optional


# ─── Config ──────────────────────────────────────────────────────────────────

@dataclass
class StrategyConfig:
    # Risk
    risk_pct: float = 1.5
    rr_ratio: float = 2.0
    atr_len: int = 14
    atr_mult: float = 1.5
    use_trail_sl: bool = True
    trail_mult: float = 2.0

    # Confluence thresholds
    long_thresh: int = 3
    short_thresh: int = 3

    # Engine 1 — EMA
    use_ema: bool = True
    ema_fast: int = 8
    ema_slow: int = 21
    ema_weight: int = 1

    # Engine 2 — Supertrend
    use_st: bool = True
    st_len: int = 10
    st_factor: float = 3.0
    st_weight: int = 1

    # Engine 3 — MACD
    use_macd: bool = True
    macd_fast: int = 12
    macd_slow: int = 26
    macd_signal: int = 9
    macd_weight: int = 1

    # Engine 4 — UT Bot
    use_utbot: bool = True
    ut_atr_period: int = 10
    ut_sensitive: float = 1.0
    ut_weight: int = 1

    # Engine 5 — VWAP
    use_vwap: bool = True
    vwap_weight: int = 1

    # Engine 6 — Gann
    use_gann: bool = True
    gann_lookback: int = 50
    gann_weight: int = 1

    # EMA-200 global filter
    use_ema200: bool = True
    ema200_len: int = 200


# ─── Engine Score ─────────────────────────────────────────────────────────────

@dataclass
class EngineScore:
    name: str
    status: str   # BULL | BEAR | FLAT | OFF
    score: int

    def to_dict(self):
        return {"name": self.name, "status": self.status, "score": self.score}


# ─── Signal ───────────────────────────────────────────────────────────────────

@dataclass
class Signal:
    symbol: str
    direction: str        # LONG | SHORT | NEUTRAL
    total_score: int
    engines: list
    price: float
    atr: float
    stop_loss: float
    take_profit: float
    ema200_status: str    # ABOVE | BELOW | OFF
    in_session: bool = True

    def to_dict(self):
        return {
            "symbol": self.symbol,
            "direction": self.direction,
            "totalScore": self.total_score,
            "engines": [e.to_dict() for e in self.engines],
            "price": round(self.price, 4),
            "atr": round(self.atr, 4),
            "stopLoss": round(self.stop_loss, 4),
            "takeProfit": round(self.take_profit, 4),
            "ema200Status": self.ema200_status,
            "inSession": self.in_session,
        }


# ─── Indicator helpers ────────────────────────────────────────────────────────

def ema(series: pd.Series, period: int) -> pd.Series:
    return series.ewm(span=period, adjust=False).mean()


def rma(series: pd.Series, period: int) -> pd.Series:
    """Wilder's smoothing (RMA) — same as Pine's ta.rma"""
    return series.ewm(alpha=1 / period, adjust=False).mean()


def atr(df: pd.DataFrame, period: int) -> pd.Series:
    high = df["high"]
    low = df["low"]
    close = df["close"]
    prev_close = close.shift(1)
    tr = pd.concat([
        high - low,
        (high - prev_close).abs(),
        (low - prev_close).abs()
    ], axis=1).max(axis=1)
    return rma(tr, period)


def supertrend(df: pd.DataFrame, period: int = 10, factor: float = 3.0):
    """
    Returns (supertrend_line, direction) where direction < 0 = bullish, > 0 = bearish
    (matching Pine Script convention)
    """
    atr_vals = atr(df, period)
    hl2 = (df["high"] + df["low"]) / 2

    upper_band = hl2 + factor * atr_vals
    lower_band = hl2 - factor * atr_vals

    st = pd.Series(index=df.index, dtype=float)
    direction = pd.Series(index=df.index, dtype=int)

    close = df["close"]

    for i in range(1, len(df)):
        prev_st = st.iloc[i - 1] if i > 1 else np.nan
        prev_close = close.iloc[i - 1]
        cur_close = close.iloc[i]

        # Adjust upper/lower bands
        if np.isnan(prev_st):
            st.iloc[i] = lower_band.iloc[i]
            direction.iloc[i] = -1
            continue

        prev_dir = direction.iloc[i - 1]

        if prev_dir <= 0:  # was bullish
            if cur_close < st.iloc[i - 1]:
                st.iloc[i] = upper_band.iloc[i]
                direction.iloc[i] = 1
            else:
                st.iloc[i] = max(lower_band.iloc[i], st.iloc[i - 1]) if cur_close > prev_close else lower_band.iloc[i]
                direction.iloc[i] = -1
        else:  # was bearish
            if cur_close > st.iloc[i - 1]:
                st.iloc[i] = lower_band.iloc[i]
                direction.iloc[i] = -1
            else:
                st.iloc[i] = min(upper_band.iloc[i], st.iloc[i - 1]) if cur_close < prev_close else upper_band.iloc[i]
                direction.iloc[i] = 1

    return st, direction


def macd(close: pd.Series, fast: int, slow: int, signal: int):
    fast_ema = ema(close, fast)
    slow_ema = ema(close, slow)
    macd_line = fast_ema - slow_ema
    signal_line = ema(macd_line, signal)
    histogram = macd_line - signal_line
    return macd_line, signal_line, histogram


def ut_bot_trail(close: pd.Series, atr_vals: pd.Series, sensitive: float):
    """UT Bot trailing stop"""
    n_loss = sensitive * atr_vals
    trail = pd.Series(index=close.index, dtype=float)

    for i in range(len(close)):
        cur_close = close.iloc[i]
        cur_nloss = n_loss.iloc[i]

        if i == 0 or np.isnan(trail.iloc[i - 1]):
            trail.iloc[i] = cur_close - cur_nloss
            continue

        prev_trail = trail.iloc[i - 1]
        prev_close = close.iloc[i - 1]

        if cur_close > prev_trail and prev_close > prev_trail:
            trail.iloc[i] = max(prev_trail, cur_close - cur_nloss)
        elif cur_close < prev_trail and prev_close < prev_trail:
            trail.iloc[i] = min(prev_trail, cur_close + cur_nloss)
        elif cur_close > prev_trail:
            trail.iloc[i] = cur_close - cur_nloss
        else:
            trail.iloc[i] = cur_close + cur_nloss

    return trail


def vwap(df: pd.DataFrame) -> pd.Series:
    """Intraday VWAP — resets each day"""
    hlc3 = (df["high"] + df["low"] + df["close"]) / 3
    vol = df["volume"]
    cum_tp_vol = (hlc3 * vol).cumsum()
    cum_vol = vol.cumsum()
    return cum_tp_vol / cum_vol


# ─── Strategy ─────────────────────────────────────────────────────────────────

class BharatXStrategy:
    def __init__(self, config: Optional[StrategyConfig] = None, symbol: str = "BTCUSDT"):
        self.config = config or StrategyConfig()
        self.symbol = symbol

    def generate(self, df: pd.DataFrame) -> Optional[Signal]:
        """
        Run all 6 engines on the DataFrame and return a Signal.
        Requires at minimum 200 rows (for EMA-200).
        df must have columns: open, high, low, close, volume
        index: timestamp (DatetimeIndex)
        """
        if len(df) < max(self.config.ema200_len, self.config.gann_lookback) + 1:
            return None

        cfg = self.config
        close = df["close"]
        cur = close.iloc[-1]

        # Shared ATR
        atr_vals = atr(df, cfg.atr_len)
        cur_atr = atr_vals.iloc[-1]

        # ─ Engine 1: EMA Crossover ────────────────────────────────────────────
        ema_fast_vals = ema(close, cfg.ema_fast)
        ema_slow_vals = ema(close, cfg.ema_slow)
        ema_bullish = ema_fast_vals.iloc[-1] > ema_slow_vals.iloc[-1]
        ema_bearish = ema_fast_vals.iloc[-1] < ema_slow_vals.iloc[-1]

        if not cfg.use_ema:
            ema_score = 0
            ema_status = "OFF"
        elif ema_bullish:
            ema_score = cfg.ema_weight
            ema_status = "BULL"
        elif ema_bearish:
            ema_score = -cfg.ema_weight
            ema_status = "BEAR"
        else:
            ema_score = 0
            ema_status = "FLAT"

        # ─ Engine 2: Supertrend ───────────────────────────────────────────────
        st_line, st_dir = supertrend(df, cfg.st_len, cfg.st_factor)
        st_bullish = st_dir.iloc[-1] < 0
        st_bearish = st_dir.iloc[-1] > 0

        if not cfg.use_st:
            st_score = 0
            st_status = "OFF"
        elif st_bullish:
            st_score = cfg.st_weight
            st_status = "BULL"
        else:
            st_score = -cfg.st_weight
            st_status = "BEAR"

        # ─ Engine 3: MACD ─────────────────────────────────────────────────────
        macd_line, macd_sig, _ = macd(close, cfg.macd_fast, cfg.macd_slow, cfg.macd_signal)
        ema50 = ema(close, 50)

        macd_uptick = macd_line.iloc[-1] > macd_line.iloc[-2]
        macd_downtick = macd_line.iloc[-1] < macd_line.iloc[-2]
        macd_bullish = macd_uptick and cur > ema50.iloc[-1]
        macd_bearish = macd_downtick and cur < ema50.iloc[-1]

        if not cfg.use_macd:
            macd_score = 0
            macd_status = "OFF"
        elif macd_bullish:
            macd_score = cfg.macd_weight
            macd_status = "BULL"
        elif macd_bearish:
            macd_score = -cfg.macd_weight
            macd_status = "BEAR"
        else:
            macd_score = 0
            macd_status = "FLAT"

        # ─ Engine 4: UT Bot ───────────────────────────────────────────────────
        ut_atr = atr(df, cfg.ut_atr_period)
        ut_trail = ut_bot_trail(close, ut_atr, cfg.ut_sensitive)
        ut_bullish = cur > ut_trail.iloc[-1]
        ut_bearish = cur < ut_trail.iloc[-1]

        if not cfg.use_utbot:
            ut_score = 0
            ut_status = "OFF"
        elif ut_bullish:
            ut_score = cfg.ut_weight
            ut_status = "BULL"
        elif ut_bearish:
            ut_score = -cfg.ut_weight
            ut_status = "BEAR"
        else:
            ut_score = 0
            ut_status = "FLAT"

        # ─ Engine 5: VWAP ─────────────────────────────────────────────────────
        vwap_vals = vwap(df)
        vwap_bullish = cur > vwap_vals.iloc[-1]
        vwap_bearish = cur < vwap_vals.iloc[-1]

        if not cfg.use_vwap:
            vwap_score = 0
            vwap_status = "OFF"
        elif vwap_bullish:
            vwap_score = cfg.vwap_weight
            vwap_status = "BULL"
        else:
            vwap_score = -cfg.vwap_weight
            vwap_status = "BEAR"

        # ─ Engine 6: Gann 50% ─────────────────────────────────────────────────
        gann_hh = df["high"].iloc[-cfg.gann_lookback:].max()
        gann_ll = df["low"].iloc[-cfg.gann_lookback:].min()
        gann_50 = (gann_hh + gann_ll) / 2.0
        gann_bullish = cur > gann_50
        gann_bearish = cur < gann_50

        if not cfg.use_gann:
            gann_score = 0
            gann_status = "OFF"
        elif gann_bullish:
            gann_score = cfg.gann_weight
            gann_status = "BULL"
        else:
            gann_score = -cfg.gann_weight
            gann_status = "BEAR"

        # ─ EMA-200 Gate ───────────────────────────────────────────────────────
        ema200_vals = ema(close, cfg.ema200_len)
        ema200_cur = ema200_vals.iloc[-1]

        if not cfg.use_ema200:
            ema200_long_ok = True
            ema200_short_ok = True
            ema200_status = "OFF"
        elif cur > ema200_cur:
            ema200_long_ok = True
            ema200_short_ok = False
            ema200_status = "ABOVE"
        else:
            ema200_long_ok = False
            ema200_short_ok = True
            ema200_status = "BELOW"

        # ─ Confluence Score ───────────────────────────────────────────────────
        total_score = ema_score + st_score + macd_score + ut_score + vwap_score + gann_score

        long_cond = total_score >= cfg.long_thresh and ema200_long_ok
        short_cond = total_score <= -cfg.short_thresh and ema200_short_ok

        if long_cond:
            direction = "LONG"
        elif short_cond:
            direction = "SHORT"
        else:
            direction = "NEUTRAL"

        # ─ Risk Sizing ────────────────────────────────────────────────────────
        sl_distance = cur_atr * cfg.atr_mult
        tp_distance = sl_distance * cfg.rr_ratio

        if direction == "LONG":
            stop_loss = cur - sl_distance
            take_profit = cur + tp_distance
        elif direction == "SHORT":
            stop_loss = cur + sl_distance
            take_profit = cur - tp_distance
        else:
            stop_loss = cur - sl_distance
            take_profit = cur + tp_distance

        engines = [
            EngineScore("EMA Cross",  ema_status,  ema_score),
            EngineScore("Supertrend", st_status,   st_score),
            EngineScore("MACD MTF",   macd_status, macd_score),
            EngineScore("UT Bot",     ut_status,   ut_score),
            EngineScore("VWAP Bias",  vwap_status, vwap_score),
            EngineScore("Gann 50pct", gann_status, gann_score),
        ]

        return Signal(
            symbol=self.symbol,
            direction=direction,
            total_score=total_score,
            engines=engines,
            price=float(cur),
            atr=float(cur_atr),
            stop_loss=float(stop_loss),
            take_profit=float(take_profit),
            ema200_status=ema200_status,
            in_session=True,
        )
