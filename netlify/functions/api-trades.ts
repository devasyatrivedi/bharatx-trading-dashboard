import type { Handler } from "@netlify/functions";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { desc, eq, and } from "drizzle-orm";
import { tradesTable } from "../../lib/db/src/schema/trades";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  return drizzle(neon(url));
}

function formatTrade(r: typeof tradesTable.$inferSelect) {
  return {
    id: r.id,
    symbol: r.symbol,
    direction: r.direction,
    entryPrice: Number(r.entryPrice),
    exitPrice: r.exitPrice ? Number(r.exitPrice) : null,
    stopLoss: Number(r.stopLoss),
    takeProfit: Number(r.takeProfit),
    quantity: r.quantity,
    status: r.status,
    pnl: r.pnl ? Number(r.pnl) : null,
    pnlPercent: r.pnlPercent ? Number(r.pnlPercent) : null,
    signalId: r.signalId ?? null,
    openedAt: r.openedAt.toISOString(),
    closedAt: r.closedAt ? r.closedAt.toISOString() : null,
    closeReason: r.closeReason ?? null,
  };
}

const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  const db = getDb();
  const params = event.queryStringParameters || {};

  // Extract trade ID from path: /api/trades/123
  const pathParts = event.path.split("/").filter(Boolean);
  const tradeId = pathParts.length > 0 ? parseInt(pathParts[pathParts.length - 1], 10) : NaN;

  // PATCH /api/trades/:id — close a trade
  if (event.httpMethod === "PATCH" && !isNaN(tradeId)) {
    const body = JSON.parse(event.body || "{}");
    const exitPrice = body.exitPrice;

    if (!exitPrice) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "exitPrice required" }),
      };
    }

    const existing = await db.select().from(tradesTable).where(eq(tradesTable.id, tradeId)).limit(1);
    if (existing.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Trade not found" }),
      };
    }

    const trade = existing[0];
    const entryPrice = Number(trade.entryPrice);
    const qty = trade.quantity;

    let pnl: number;
    if (trade.direction === "LONG") {
      pnl = (exitPrice - entryPrice) * qty;
    } else {
      pnl = (entryPrice - exitPrice) * qty;
    }
    const pnlPercent =
      ((exitPrice - entryPrice) / entryPrice) * 100 * (trade.direction === "SHORT" ? -1 : 1);

    const updated = await db
      .update(tradesTable)
      .set({
        exitPrice: String(exitPrice),
        status: "closed",
        pnl: String(pnl.toFixed(4)),
        pnlPercent: String(pnlPercent.toFixed(4)),
        closedAt: new Date(),
        closeReason: body.closeReason ?? "Manual close",
      })
      .where(eq(tradesTable.id, tradeId))
      .returning();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(formatTrade(updated[0])),
    };
  }

  // GET /api/trades/:id
  if (event.httpMethod === "GET" && !isNaN(tradeId) && tradeId > 0) {
    const rows = await db.select().from(tradesTable).where(eq(tradesTable.id, tradeId)).limit(1);
    if (rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Trade not found" }),
      };
    }
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(formatTrade(rows[0])),
    };
  }

  // POST /api/trades — create new trade
  if (event.httpMethod === "POST") {
    const body = JSON.parse(event.body || "{}");

    const inserted = await db
      .insert(tradesTable)
      .values({
        symbol: body.symbol,
        direction: body.direction,
        entryPrice: String(body.entryPrice),
        stopLoss: String(body.stopLoss),
        takeProfit: String(body.takeProfit),
        quantity: body.quantity,
        status: "open",
        signalId: body.signalId ?? null,
        openedAt: new Date(),
      })
      .returning();

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(formatTrade(inserted[0])),
    };
  }

  // GET /api/trades — list trades
  const status = params.status ?? "all";
  const symbol = params.symbol;

  let rows;
  if (status === "all" && !symbol) {
    rows = await db.select().from(tradesTable).orderBy(desc(tradesTable.openedAt));
  } else if (status === "all" && symbol) {
    rows = await db
      .select()
      .from(tradesTable)
      .where(eq(tradesTable.symbol, symbol))
      .orderBy(desc(tradesTable.openedAt));
  } else if (status !== "all" && !symbol) {
    rows = await db
      .select()
      .from(tradesTable)
      .where(eq(tradesTable.status, status as "open" | "closed"))
      .orderBy(desc(tradesTable.openedAt));
  } else {
    rows = await db
      .select()
      .from(tradesTable)
      .where(
        and(
          eq(tradesTable.status, status as "open" | "closed"),
          eq(tradesTable.symbol, symbol!)
        )
      )
      .orderBy(desc(tradesTable.openedAt));
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(rows.map(formatTrade)),
  };
};

export { handler };
