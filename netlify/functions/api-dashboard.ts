import type { Handler } from "@netlify/functions";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { desc, sql } from "drizzle-orm";
import { tradesTable } from "../../lib/db/src/schema/trades";
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

  // GET /api/dashboard/pnl-chart
  if (event.path.includes("/pnl-chart")) {
    const days = parseInt(params.days || "30", 10);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const trades = await db
      .select()
      .from(tradesTable)
      .where(
        sql`${tradesTable.status} = 'closed' AND ${tradesTable.closedAt} >= ${since.toISOString()}`
      )
      .orderBy(tradesTable.closedAt);

    const byDate: Record<string, { pnl: number; count: number }> = {};
    for (const t of trades) {
      if (!t.closedAt || t.pnl === null) continue;
      const dateKey = t.closedAt.toISOString().split("T")[0];
      if (!byDate[dateKey]) byDate[dateKey] = { pnl: 0, count: 0 };
      byDate[dateKey].pnl += Number(t.pnl);
      byDate[dateKey].count += 1;
    }

    let cumulative = 0;
    const points = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { pnl, count }]) => {
        cumulative += pnl;
        return { date, cumulativePnl: cumulative, tradeCount: count };
      });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(points),
    };
  }

  // GET /api/dashboard/engine-accuracy
  if (event.path.includes("/engine-accuracy")) {
    const signals = await db.select().from(signalsTable).orderBy(desc(signalsTable.timestamp));

    const engineStats: Record<string, { bull: number; bear: number }> = {};

    for (const signal of signals) {
      const engines = signal.engines as Array<{ name: string; status: string; score: number }>;
      if (!Array.isArray(engines)) continue;
      for (const engine of engines) {
        if (!engineStats[engine.name]) engineStats[engine.name] = { bull: 0, bear: 0 };
        if (engine.status === "BULL") engineStats[engine.name].bull += 1;
        else if (engine.status === "BEAR") engineStats[engine.name].bear += 1;
      }
    }

    const result = Object.entries(engineStats).map(([engine, { bull, bear }]) => ({
      engine,
      bullSignals: bull,
      bearSignals: bear,
      accuracy: bull + bear > 0 ? (bull / (bull + bear)) * 100 : 0,
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };
  }

  // GET /api/dashboard/summary (default)
  const allTrades = await db.select().from(tradesTable).orderBy(desc(tradesTable.openedAt));

  const totalTrades = allTrades.length;
  const openTrades = allTrades.filter((t) => t.status === "open").length;
  const closedTrades = allTrades.filter((t) => t.status === "closed").length;
  const withPnl = allTrades.filter((t) => t.pnl !== null);
  const winningTrades = withPnl.filter((t) => Number(t.pnl) > 0).length;
  const losingTrades = withPnl.filter((t) => Number(t.pnl) <= 0).length;
  const winRate = closedTrades > 0 ? (winningTrades / closedTrades) * 100 : 0;

  const totalPnl = withPnl.reduce((sum, t) => sum + Number(t.pnl), 0);
  const avgPnlPerTrade = closedTrades > 0 ? totalPnl / closedTrades : 0;
  const bestTrade = withPnl.length > 0 ? Math.max(...withPnl.map((t) => Number(t.pnl))) : 0;
  const worstTrade = withPnl.length > 0 ? Math.min(...withPnl.map((t) => Number(t.pnl))) : 0;
  const initialCapital = 500000;
  const currentCapital = initialCapital + totalPnl;
  const totalPnlPercent = (totalPnl / initialCapital) * 100;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      totalTrades,
      openTrades,
      closedTrades,
      winningTrades,
      losingTrades,
      winRate,
      totalPnl,
      totalPnlPercent,
      avgPnlPerTrade,
      bestTrade,
      worstTrade,
      currentCapital,
    }),
  };
};

export { handler };
