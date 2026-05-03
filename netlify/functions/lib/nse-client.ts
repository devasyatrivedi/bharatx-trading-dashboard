/**
 * NSE India API Client
 * Handles session cookies, rate limiting, and fallback to Yahoo Finance.
 * Designed for serverless (Netlify Functions) — no persistent state between invocations.
 */

import { STOCK_MAP } from "./nse-stocks";

const NSE_BASE = "https://www.nseindia.com";
const YAHOO_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";

const NSE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  Connection: "keep-alive",
  Referer: "https://www.nseindia.com/",
};

export interface QuoteData {
  symbol: string;
  displaySymbol: string;
  name: string;
  sector: string;
  price: number;
  prevClose: number;
  changePct: number;
  volume: number;
  marketCap: number;
  currency: string;
  exchange: string;
  lastUpdated: number;
}

// ─── NSE Session Management ──────────────────────────────────────────────────

async function getNseCookies(): Promise<string> {
  try {
    const res = await fetch(NSE_BASE, {
      headers: NSE_HEADERS,
      redirect: "follow",
    });
    const setCookies = res.headers.getSetCookie?.() || [];
    return setCookies.map((c) => c.split(";")[0]).join("; ");
  } catch {
    return "";
  }
}

async function fetchNseQuote(symbol: string, cookies: string): Promise<QuoteData | null> {
  // NSE API uses the symbol without .NS suffix
  const nseSymbol = symbol.replace(".NS", "");

  try {
    const url = `${NSE_BASE}/api/quote-equity?symbol=${encodeURIComponent(nseSymbol)}`;
    const res = await fetch(url, {
      headers: {
        ...NSE_HEADERS,
        Cookie: cookies,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const info = data?.priceInfo;
    if (!info) return null;

    const stockInfo = STOCK_MAP.get(symbol);
    const price = info.lastPrice ?? info.close ?? 0;
    const prevClose = info.previousClose ?? price;
    const changePct = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;

    return {
      symbol,
      displaySymbol: nseSymbol,
      name: stockInfo?.name ?? nseSymbol,
      sector: stockInfo?.sector ?? "Unknown",
      price: Math.round(price * 100) / 100,
      prevClose: Math.round(prevClose * 100) / 100,
      changePct: Math.round(changePct * 10000) / 10000,
      volume: info.totalTradedVolume ?? data?.securityWiseDP?.quantityTraded ?? 0,
      marketCap: data?.securityInfo?.marketCap ?? 0,
      currency: "INR",
      exchange: "NSE",
      lastUpdated: Math.floor(Date.now() / 1000),
    };
  } catch {
    return null;
  }
}

// ─── Yahoo Finance Fallback ──────────────────────────────────────────────────

async function fetchYahooQuote(symbol: string): Promise<QuoteData | null> {
  try {
    const url = `${YAHOO_BASE}/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": NSE_HEADERS["User-Agent"],
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const price = meta.regularMarketPrice ?? 0;
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const changePct = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;

    const stockInfo = STOCK_MAP.get(symbol);
    const displaySymbol = symbol.replace(".NS", "").replace("^", "");

    return {
      symbol,
      displaySymbol,
      name: stockInfo?.name ?? displaySymbol,
      sector: stockInfo?.sector ?? "Unknown",
      price: Math.round(price * 100) / 100,
      prevClose: Math.round(prevClose * 100) / 100,
      changePct: Math.round(changePct * 10000) / 10000,
      volume: meta.regularMarketVolume ?? 0,
      marketCap: 0,
      currency: meta.currency ?? "INR",
      exchange: "NSE",
      lastUpdated: Math.floor(Date.now() / 1000),
    };
  } catch {
    return null;
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Fetch quotes for a batch of symbols.
 * Tries NSE India API first, falls back to Yahoo Finance.
 */
export async function fetchQuotes(symbols: string[]): Promise<QuoteData[]> {
  if (!symbols.length) return [];

  // Try NSE first for .NS symbols
  const nseSymbols = symbols.filter((s) => s.endsWith(".NS"));
  const indexSymbols = symbols.filter((s) => s.startsWith("^"));

  const results: QuoteData[] = [];
  let cookies = "";

  // Attempt NSE for equity symbols (batch of 5 to avoid rate limits)
  if (nseSymbols.length > 0) {
    try {
      cookies = await getNseCookies();
    } catch {
      // Will fall through to Yahoo
    }

    if (cookies) {
      const BATCH_SIZE = 5;
      for (let i = 0; i < nseSymbols.length; i += BATCH_SIZE) {
        const batch = nseSymbols.slice(i, i + BATCH_SIZE);
        const promises = batch.map((sym) => fetchNseQuote(sym, cookies));
        const batchResults = await Promise.allSettled(promises);

        for (const result of batchResults) {
          if (result.status === "fulfilled" && result.value) {
            results.push(result.value);
          }
        }

        // Small delay between batches to be polite to NSE
        if (i + BATCH_SIZE < nseSymbols.length) {
          await new Promise((r) => setTimeout(r, 200));
        }
      }
    }
  }

  // Fetch missing symbols via Yahoo Finance (NSE failures + indices)
  const fetched = new Set(results.map((r) => r.symbol));
  const missing = [...nseSymbols.filter((s) => !fetched.has(s)), ...indexSymbols];

  if (missing.length > 0) {
    const yahooPromises = missing.map((sym) => fetchYahooQuote(sym));
    const yahooResults = await Promise.allSettled(yahooPromises);

    for (const result of yahooResults) {
      if (result.status === "fulfilled" && result.value) {
        results.push(result.value);
      }
    }
  }

  return results;
}

/**
 * Fetch a single quote — tries NSE, then Yahoo.
 */
export async function fetchSingleQuote(symbol: string): Promise<QuoteData | null> {
  const results = await fetchQuotes([symbol]);
  return results[0] ?? null;
}
