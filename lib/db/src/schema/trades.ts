import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tradesTable = pgTable("trades", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  direction: text("direction", { enum: ["LONG", "SHORT"] }).notNull(),
  entryPrice: numeric("entry_price", { precision: 12, scale: 4 }).notNull(),
  exitPrice: numeric("exit_price", { precision: 12, scale: 4 }),
  stopLoss: numeric("stop_loss", { precision: 12, scale: 4 }).notNull(),
  takeProfit: numeric("take_profit", { precision: 12, scale: 4 }).notNull(),
  quantity: integer("quantity").notNull(),
  status: text("status", { enum: ["open", "closed"] }).notNull().default("open"),
  pnl: numeric("pnl", { precision: 12, scale: 4 }),
  pnlPercent: numeric("pnl_percent", { precision: 8, scale: 4 }),
  signalId: integer("signal_id"),
  openedAt: timestamp("opened_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),
  closeReason: text("close_reason"),
});

export const insertTradeSchema = createInsertSchema(tradesTable).omit({ id: true });
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof tradesTable.$inferSelect;
