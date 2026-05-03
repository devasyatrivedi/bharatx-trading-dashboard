import { Router, type IRouter } from "express";
import { db, signalsTable } from "@workspace/db";
import { desc, eq, sql } from "drizzle-orm";
import { ListSignalsQueryParams, GetLatestSignalResponse, ListSignalsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/signals/latest", async (req, res) => {
  const rows = await db
    .select()
    .from(signalsTable)
    .orderBy(desc(signalsTable.timestamp))
    .limit(1);

  if (rows.length === 0) {
    return res.status(404).json({ error: "No signals found" });
  }

  const row = rows[0];
  const data = GetLatestSignalResponse.parse({
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
  });

  res.json(data);
});

router.get("/signals", async (req, res) => {
  const query = ListSignalsQueryParams.parse(req.query);
  const limit = query.limit ?? 50;
  const symbol = query.symbol;

  const baseQuery = db.select().from(signalsTable);
  let rows;
  if (symbol) {
    rows = await baseQuery
      .where(eq(signalsTable.symbol, symbol))
      .orderBy(desc(signalsTable.timestamp))
      .limit(limit);
  } else {
    rows = await baseQuery
      .orderBy(desc(signalsTable.timestamp))
      .limit(limit);
  }

  const data = ListSignalsResponse.parse(
    rows.map((row) => ({
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
    }))
  );

  res.json(data);
});

export default router;
