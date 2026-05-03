import type { Handler } from "@netlify/functions";
import { SECTORS, NSE_STOCKS, toStockEntry } from "./lib/nse-stocks";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=3600",
};

const handler: Handler = async (event) => {
  const params = event.queryStringParameters || {};

  // If sector filter provided, return stocks list
  if (params.sector) {
    const stocks = NSE_STOCKS
      .filter(([, , sec]) => sec.toLowerCase() === params.sector!.toLowerCase())
      .map(toStockEntry);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ stocks, total: stocks.length }),
    };
  }

  // Return stock list or sectors
  if (event.path.includes("/sectors")) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ sectors: SECTORS }),
    };
  }

  // Full stock list
  const stocks = NSE_STOCKS.map(toStockEntry);
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ stocks, total: stocks.length }),
  };
};

export { handler };
