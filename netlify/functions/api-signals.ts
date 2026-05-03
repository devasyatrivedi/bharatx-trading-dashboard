import type { Handler } from "@netlify/functions";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { desc, eq } from "drizzle-orm";
import { signalsTable } from "../../lib/db/src/schema/signals";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  return drizzle(neon(url));
}

const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  const db = getDb();
  const params = event.queryStringParameters || {};

  // GET /api/signals/latest
  if (event.path.includes("/latest")) {
    const rows = await db
      .select()
      .from(signalsTable)
      .orderBy(desc(signalsTable.timestamp))
      .limit(1);

    if (rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "No signals found" }),
      };
    }

    const row = rows[0];
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: row.id,
        symbol: row.symbol,
        timestamp: row.timestamp.toISOString(),
        direction: row.direction,
        totalScore: row.totalScore,
        engines: row.engines,
        price: Number(row.price),
        atr: row.atr ? Number(row.atr) : undefined,
        stopLoss: row.stopLoss ? Number(row.stopLoss) : undefined,
        takeProfit: row.takeProfit ? Number(row.takeProfit) : undefined,
        ema200Status: row.ema200Status ?? undefined,
        inSession: row.inSession ?? true,
      }),
    };
  }

  // GET /api/signals
  const limit = Math.min(parseInt(params.limit || "50", 10), 200);
  const symbol = params.symbol;

  let rows;
  if (symbol) {
    rows = await db
      .select()
      .from(signalsTable)
      .where(eq(signalsTable.symbol, symbol))
      .orderBy(desc(signalsTable.timestamp))
      .limit(limit);
  } else {
    rows = await db
      .select()
      .from(signalsTable)
      .orderBy(desc(signalsTable.timestamp))
      .limit(limit);
  }

  const data = rows.map((row) => ({
    id: row.id,
    symbol: row.symbol,
    timestamp: row.timestamp.toISOString(),
    direction: row.direction,
    totalScore: row.totalScore,
    engines: row.engines,
    price: Number(row.price),
    atr: row.atr ? Number(row.atr) : undefined,
    stopLoss: row.stopLoss ? Number(row.stopLoss) : undefined,
    takeProfit: row.takeProfit ? Number(row.takeProfit) : undefined,
    ema200Status: row.ema200Status ?? undefined,
    inSession: row.inSession ?? true,
  }));

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(data),
  };
};

export { handler };
