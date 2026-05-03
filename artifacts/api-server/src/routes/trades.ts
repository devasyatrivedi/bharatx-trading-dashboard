import { Router, type IRouter } from "express";
import { db, tradesTable } from "@workspace/db";
import { desc, eq, and } from "drizzle-orm";
import {
  ListTradesQueryParams,
  ListTradesResponse,
  CreateTradeBody,
  GetTradeParams,
  GetTradeResponse,
  CloseTradeParams,
  CloseTradeBody,
  CloseTradeResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/trades", async (req, res) => {
  const query = ListTradesQueryParams.parse(req.query);
  const status = query.status ?? "all";
  const symbol = query.symbol;

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

  const data = ListTradesResponse.parse(
    rows.map((r) => ({
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
    }))
  );

  res.json(data);
});

router.post("/trades", async (req, res) => {
  const body = CreateTradeBody.parse(req.body);

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

  const r = inserted[0];
  res.status(201).json({
    id: r.id,
    symbol: r.symbol,
    direction: r.direction,
    entryPrice: Number(r.entryPrice),
    exitPrice: null,
    stopLoss: Number(r.stopLoss),
    takeProfit: Number(r.takeProfit),
    quantity: r.quantity,
    status: r.status,
    pnl: null,
    pnlPercent: null,
    signalId: r.signalId ?? null,
    openedAt: r.openedAt.toISOString(),
    closedAt: null,
    closeReason: null,
  });
});

router.get("/trades/:id", async (req, res) => {
  const { id } = GetTradeParams.parse({ id: Number(req.params.id) });

  const rows = await db.select().from(tradesTable).where(eq(tradesTable.id, id)).limit(1);
  if (rows.length === 0) return res.status(404).json({ error: "Trade not found" });

  const r = rows[0];
  const data = GetTradeResponse.parse({
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
  });

  res.json(data);
});

router.patch("/trades/:id", async (req, res) => {
  const { id } = CloseTradeParams.parse({ id: Number(req.params.id) });
  const body = CloseTradeBody.parse(req.body);

  const existing = await db.select().from(tradesTable).where(eq(tradesTable.id, id)).limit(1);
  if (existing.length === 0) return res.status(404).json({ error: "Trade not found" });

  const trade = existing[0];
  const exitPrice = body.exitPrice;
  const entryPrice = Number(trade.entryPrice);
  const qty = trade.quantity;

  let pnl: number;
  if (trade.direction === "LONG") {
    pnl = (exitPrice - entryPrice) * qty;
  } else {
    pnl = (entryPrice - exitPrice) * qty;
  }
  const pnlPercent = ((exitPrice - entryPrice) / entryPrice) * 100 * (trade.direction === "SHORT" ? -1 : 1);

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
    .where(eq(tradesTable.id, id))
    .returning();

  const r = updated[0];
  const data = CloseTradeResponse.parse({
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
  });

  res.json(data);
});

export default router;
