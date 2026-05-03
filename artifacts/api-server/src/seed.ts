import { db, signalsTable, tradesTable } from "@workspace/db";

const engines = (emaScore: number, stScore: number, macdScore: number, utScore: number, vwapScore: number, gannScore: number) => [
  { name: "EMA Cross",  status: emaScore  > 0 ? "BULL" : emaScore  < 0 ? "BEAR" : "FLAT", score: emaScore  },
  { name: "Supertrend", status: stScore   > 0 ? "BULL" : stScore   < 0 ? "BEAR" : "FLAT", score: stScore   },
  { name: "MACD MTF",   status: macdScore > 0 ? "BULL" : macdScore < 0 ? "BEAR" : "FLAT", score: macdScore },
  { name: "UT Bot",     status: utScore   > 0 ? "BULL" : utScore   < 0 ? "BEAR" : "FLAT", score: utScore   },
  { name: "VWAP Bias",  status: vwapScore > 0 ? "BULL" : vwapScore < 0 ? "BEAR" : "FLAT", score: vwapScore },
  { name: "Gann 50pct", status: gannScore > 0 ? "BULL" : gannScore < 0 ? "BEAR" : "FLAT", score: gannScore },
];

async function seed() {
  const existingSignals = await db.select().from(signalsTable).limit(1);
  if (existingSignals.length > 0) {
    console.log("Already seeded, skipping");
    return;
  }

  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

  // Seed signals
  const signalData = [
    {
      symbol: "NIFTY", timestamp: daysAgo(14), direction: "LONG" as const,
      totalScore: 4, engines: engines(1,1,1,1,-1,1), price: "21850.50",
      atr: "125.40", stopLoss: "21662.30", takeProfit: "22226.90",
      ema200Status: "ABOVE" as const, inSession: true,
    },
    {
      symbol: "BANKNIFTY", timestamp: daysAgo(12), direction: "SHORT" as const,
      totalScore: -4, engines: engines(-1,-1,-1,-1,1,-1), price: "47200.00",
      atr: "280.00", stopLoss: "47620.00", takeProfit: "46360.00",
      ema200Status: "BELOW" as const, inSession: true,
    },
    {
      symbol: "RELIANCE", timestamp: daysAgo(10), direction: "LONG" as const,
      totalScore: 5, engines: engines(1,1,1,1,1,-1), price: "2842.75",
      atr: "38.50", stopLoss: "2784.50", takeProfit: "2957.25",
      ema200Status: "ABOVE" as const, inSession: true,
    },
    {
      symbol: "HDFCBANK", timestamp: daysAgo(8), direction: "NEUTRAL" as const,
      totalScore: 1, engines: engines(1,-1,1,-1,1,-1), price: "1685.30",
      atr: "22.10", stopLoss: "1652.15", takeProfit: "1751.60",
      ema200Status: "ABOVE" as const, inSession: true,
    },
    {
      symbol: "NIFTY", timestamp: daysAgo(6), direction: "SHORT" as const,
      totalScore: -3, engines: engines(-1,-1,-1,1,-1,1), price: "22100.00",
      atr: "140.00", stopLoss: "22310.00", takeProfit: "21680.00",
      ema200Status: "ABOVE" as const, inSession: true,
    },
    {
      symbol: "INFY", timestamp: daysAgo(4), direction: "LONG" as const,
      totalScore: 6, engines: engines(1,1,1,1,1,1), price: "1540.00",
      atr: "18.20", stopLoss: "1512.70", takeProfit: "1594.60",
      ema200Status: "ABOVE" as const, inSession: true,
    },
    {
      symbol: "TCS", timestamp: daysAgo(2), direction: "LONG" as const,
      totalScore: 3, engines: engines(1,1,1,-1,-1,1), price: "3920.00",
      atr: "48.00", stopLoss: "3848.00", takeProfit: "4064.00",
      ema200Status: "ABOVE" as const, inSession: true,
    },
    {
      symbol: "NIFTY", timestamp: daysAgo(0.5), direction: "LONG" as const,
      totalScore: 4, engines: engines(1,1,-1,1,1,1), price: "22450.00",
      atr: "130.00", stopLoss: "22255.00", takeProfit: "22840.00",
      ema200Status: "ABOVE" as const, inSession: true,
    },
  ];

  const insertedSignals = await db.insert(signalsTable).values(signalData).returning();

  // Seed trades
  const d = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

  await db.insert(tradesTable).values([
    {
      symbol: "NIFTY", direction: "LONG" as const, entryPrice: "21850.50",
      exitPrice: "22226.90", stopLoss: "21662.30", takeProfit: "22226.90",
      quantity: 50, status: "closed" as const,
      pnl: String(((22226.90 - 21850.50) * 50).toFixed(4)),
      pnlPercent: String((((22226.90 - 21850.50) / 21850.50) * 100).toFixed(4)),
      signalId: insertedSignals[0].id, openedAt: d(14), closedAt: d(11),
      closeReason: "Take profit hit",
    },
    {
      symbol: "BANKNIFTY", direction: "SHORT" as const, entryPrice: "47200.00",
      exitPrice: "46600.00", stopLoss: "47620.00", takeProfit: "46360.00",
      quantity: 25, status: "closed" as const,
      pnl: String(((47200.00 - 46600.00) * 25).toFixed(4)),
      pnlPercent: String((((47200.00 - 46600.00) / 47200.00) * 100).toFixed(4)),
      signalId: insertedSignals[1].id, openedAt: d(12), closedAt: d(9),
      closeReason: "Manual close",
    },
    {
      symbol: "RELIANCE", direction: "LONG" as const, entryPrice: "2842.75",
      exitPrice: "2784.50", stopLoss: "2784.50", takeProfit: "2957.25",
      quantity: 100, status: "closed" as const,
      pnl: String(((2784.50 - 2842.75) * 100).toFixed(4)),
      pnlPercent: String((((2784.50 - 2842.75) / 2842.75) * 100).toFixed(4)),
      signalId: insertedSignals[2].id, openedAt: d(10), closedAt: d(7),
      closeReason: "Stop loss hit",
    },
    {
      symbol: "INFY", direction: "LONG" as const, entryPrice: "1540.00",
      exitPrice: "1594.60", stopLoss: "1512.70", takeProfit: "1594.60",
      quantity: 200, status: "closed" as const,
      pnl: String(((1594.60 - 1540.00) * 200).toFixed(4)),
      pnlPercent: String((((1594.60 - 1540.00) / 1540.00) * 100).toFixed(4)),
      signalId: insertedSignals[5].id, openedAt: d(4), closedAt: d(1),
      closeReason: "Take profit hit",
    },
    {
      symbol: "NIFTY", direction: "LONG" as const, entryPrice: "22450.00",
      exitPrice: null, stopLoss: "22255.00", takeProfit: "22840.00",
      quantity: 50, status: "open" as const,
      pnl: null, pnlPercent: null,
      signalId: insertedSignals[7].id, openedAt: d(0.5),
      closedAt: null, closeReason: null,
    },
    {
      symbol: "TCS", direction: "LONG" as const, entryPrice: "3920.00",
      exitPrice: null, stopLoss: "3848.00", takeProfit: "4064.00",
      quantity: 75, status: "open" as const,
      pnl: null, pnlPercent: null,
      signalId: insertedSignals[6].id, openedAt: d(2),
      closedAt: null, closeReason: null,
    },
  ]);

  console.log("Seed complete");
}

seed().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
