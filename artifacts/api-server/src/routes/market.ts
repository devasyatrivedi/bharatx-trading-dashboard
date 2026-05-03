import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const MARKET_DATA_URL = process.env["MARKET_DATA_URL"] ?? "http://127.0.0.1:5000";

async function proxyMarket(path: string, query?: Record<string, string>) {
  const url = new URL(path, MARKET_DATA_URL);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(45000),
  });

  if (!res.ok) {
    throw new Error(`Market service error: ${res.status}`);
  }
  return res.json();
}

router.get("/market/stocks", async (req, res) => {
  try {
    const sector = req.query["sector"] as string | undefined;
    const data = await proxyMarket("/stocks", sector ? { sector } : undefined);
    res.json(data);
  } catch (err) {
    logger.error({ err }, "Failed to fetch stock list");
    res.status(502).json({ error: "Market data service unavailable" });
  }
});

router.get("/market/sectors", async (_req, res) => {
  try {
    const data = await proxyMarket("/stocks/sectors");
    res.json(data);
  } catch (err) {
    logger.error({ err }, "Failed to fetch sectors");
    res.status(502).json({ error: "Market data service unavailable" });
  }
});

router.get("/market/quotes", async (req, res) => {
  try {
    const symbols = req.query["symbols"] as string | undefined;
    if (!symbols) return res.status(400).json({ error: "symbols param required" });
    const data = await proxyMarket("/quotes", { symbols });
    res.json(data);
  } catch (err) {
    logger.error({ err }, "Failed to fetch quotes");
    res.status(502).json({ error: "Market data service unavailable" });
  }
});

router.get("/market/quotes/batch", async (req, res) => {
  try {
    const sector = req.query["sector"] as string | undefined;
    const limit = req.query["limit"] as string | undefined;
    const params: Record<string, string> = {};
    if (sector) params["sector"] = sector;
    if (limit) params["limit"] = limit;
    const data = await proxyMarket("/quotes/batch", params);
    res.json(data);
  } catch (err) {
    logger.error({ err }, "Failed to fetch batch quotes");
    res.status(502).json({ error: "Market data service unavailable" });
  }
});

router.get("/market/search", async (req, res) => {
  try {
    const q = req.query["q"] as string | undefined;
    const limit = req.query["limit"] as string | undefined;
    const params: Record<string, string> = {};
    if (q) params["q"] = q;
    if (limit) params["limit"] = limit;
    const data = await proxyMarket("/search", params);
    res.json(data);
  } catch (err) {
    logger.error({ err }, "Failed to search stocks");
    res.status(502).json({ error: "Market data service unavailable" });
  }
});

export default router;
