import type { Handler } from "@netlify/functions";
import { NSE_STOCKS, toStockEntry } from "./lib/nse-stocks";
import { fetchQuotes } from "./lib/nse-client";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=60",
};

const handler: Handler = async (event) => {
  const params = event.queryStringParameters || {};
  const q = (params.q || "").toLowerCase().trim();
  const limit = Math.min(parseInt(params.limit || "10", 10), 30);

  if (!q) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ results: [] }),
    };
  }

  // Search by symbol or name (local, no API call needed)
  const results = NSE_STOCKS
    .filter(([sym, name]) => {
      const symL = sym.toLowerCase();
      const nameL = name.toLowerCase();
      return symL.includes(q) || nameL.includes(q);
    })
    .slice(0, limit)
    .map(toStockEntry);

  // Optionally fetch live quotes for search results
  if (results.length > 0 && params.withQuotes === "true") {
    const symbols = results.map((r) => r.symbol);
    const quotes = await fetchQuotes(symbols);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ results, quotes, count: results.length }),
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ results, count: results.length }),
  };
};

export { handler };
