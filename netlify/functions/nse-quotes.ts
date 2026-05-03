import type { Handler } from "@netlify/functions";
import { fetchQuotes } from "./lib/nse-client";
import { NSE_STOCKS, toStockEntry } from "./lib/nse-stocks";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=30",
};

const handler: Handler = async (event) => {
  // Handle sector batch quotes: /api/market/quotes/batch?sector=IT&limit=20
  // Handle symbol quotes: /api/market/quotes?symbols=RELIANCE.NS,TCS.NS
  const params = event.queryStringParameters || {};

  // Batch by sector
  if (event.path.includes("/batch") || params.sector) {
    const sector = params.sector || "";
    const limit = Math.min(parseInt(params.limit || "20", 10), 50);

    let symbols: string[];
    if (sector && sector !== "All") {
      symbols = NSE_STOCKS
        .filter(([, , sec]) => sec.toLowerCase() === sector.toLowerCase())
        .map(([sym]) => sym)
        .slice(0, limit);
    } else {
      symbols = NSE_STOCKS.map(([sym]) => sym).slice(0, limit);
    }

    const quotes = await fetchQuotes(symbols);

    // Sort by abs change_pct descending (most active)
    const sorted = [...quotes].sort(
      (a, b) => Math.abs(b.changePct) - Math.abs(a.changePct)
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        quotes: sorted,
        count: sorted.length,
        sector: sector || "all",
      }),
    };
  }

  // Individual symbols
  const symbolsRaw = params.symbols || "";
  if (!symbolsRaw) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "symbols param required" }),
    };
  }

  const symbols = symbolsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);

  const quotes = await fetchQuotes(symbols);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ quotes, count: quotes.length }),
  };
};

export { handler };
