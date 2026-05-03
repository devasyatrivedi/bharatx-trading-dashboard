import { pgTable, serial, text, integer, numeric, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const signalsTable = pgTable("signals", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  direction: text("direction", { enum: ["LONG", "SHORT", "NEUTRAL"] }).notNull(),
  totalScore: integer("total_score").notNull(),
  engines: jsonb("engines").notNull(),
  price: numeric("price", { precision: 12, scale: 4 }).notNull(),
  atr: numeric("atr", { precision: 12, scale: 4 }),
  stopLoss: numeric("stop_loss", { precision: 12, scale: 4 }),
  takeProfit: numeric("take_profit", { precision: 12, scale: 4 }),
  ema200Status: text("ema200_status", { enum: ["ABOVE", "BELOW", "OFF"] }),
  inSession: boolean("in_session").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSignalSchema = createInsertSchema(signalsTable).omit({ id: true, createdAt: true });
export type InsertSignal = z.infer<typeof insertSignalSchema>;
export type Signal = typeof signalsTable.$inferSelect;
