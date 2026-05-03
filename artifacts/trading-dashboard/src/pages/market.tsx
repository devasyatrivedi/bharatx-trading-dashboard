import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  TrendingDown,
  Search,
  RefreshCw,
  BarChart2,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface StockInfo {
  symbol: string;
  displaySymbol: string;
  name: string;
  sector: string;
}

interface Quote extends StockInfo {
  price: number | null;
  prevClose: number | null;
  changePct: number;
  volume: number;
  marketCap: number;
  currency: string;
  lastUpdated: number;
}

const SECTORS = [
  "All",
  "IT",
  "Banking",
  "Finance",
  "Auto",
  "Pharma",
  "Energy",
  "Metal",
  "FMCG",
  "Consumer",
  "Cement",
  "Infrastructure",
  "Real Estate",
  "Power",
  "Defence",
  "Telecom",
  "Healthcare",
  "Insurance",
  "Chemicals",
  "Agri",
];

function fmtPrice(v: number | null) {
  if (v == null) return "—";
  return `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtCap(v: number) {
  if (!v) return "—";
  if (v >= 1e12) return `₹${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `₹${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`;
  return `₹${v.toLocaleString("en-IN")}`;
}

function fmtVol(v: number) {
  if (!v) return "—";
  if (v >= 1e7) return `${(v / 1e7).toFixed(2)}Cr`;
  if (v >= 1e5) return `${(v / 1e5).toFixed(2)}L`;
  return v.toLocaleString("en-IN");
}

async function fetchBatch(sector: string, limit = 30): Promise<Quote[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (sector !== "All") params.set("sector", sector);
  const r = await fetch(`${BASE}/api/market/quotes/batch?${params}`);
  if (!r.ok) throw new Error(await r.text());
  const d = await r.json();
  return d.quotes ?? [];
}

async function searchStocks(q: string): Promise<StockInfo[]> {
  const r = await fetch(`${BASE}/api/market/search?q=${encodeURIComponent(q)}&limit=20`);
  if (!r.ok) throw new Error(await r.text());
  const d = await r.json();
  return d.results ?? [];
}

async function fetchQuotes(symbols: string[]): Promise<Quote[]> {
  if (!symbols.length) return [];
  const r = await fetch(`${BASE}/api/market/quotes?symbols=${symbols.join(",")}`);
  if (!r.ok) throw new Error(await r.text());
  const d = await r.json();
  return d.quotes ?? [];
}

export default function MarketPage() {
  const [sector, setSector] = useState("IT");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<StockInfo[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadQuotes = useCallback(async (sec: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBatch(sec, 40);
      setQuotes(data);
      setLastRefresh(new Date());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load market data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuotes(sector);
  }, [sector, loadQuotes]);

  // Search debounce
  useEffect(() => {
    if (!searchQ.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await searchStocks(searchQ);
        setSearchResults(results);
        // Also fetch live quotes for search results
        if (results.length > 0) {
          const syms = results.slice(0, 15).map((s) => s.symbol);
          const qs = await fetchQuotes(syms);
          setQuotes(qs);
          setLastRefresh(new Date());
        }
      } catch {
        // silent
      } finally {
        setSearchLoading(false);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [searchQ]);

  const displayQuotes = searchQ.trim() ? quotes : quotes;

  const gainers = [...quotes].filter((q) => q.changePct > 0).sort((a, b) => b.changePct - a.changePct).slice(0, 5);
  const losers  = [...quotes].filter((q) => q.changePct < 0).sort((a, b) => a.changePct - b.changePct).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">NSE Market</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Live quotes for 200+ NSE stocks powered by Yahoo Finance
            {lastRefresh && (
              <span className="ml-2 text-xs text-muted-foreground/60">
                · last updated {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadQuotes(sector)}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Market data unavailable</AlertTitle>
          <AlertDescription>
            {error}. Make sure the Python market data service is running:
            <code className="ml-2 text-xs bg-muted px-1 py-0.5 rounded">
              python3 services/market-data/market_server.py
            </code>
          </AlertDescription>
        </Alert>
      )}

      {/* Top Movers */}
      {!searchQ && quotes.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-success/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-success flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Top Gainers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {gainers.map((q) => (
                <div key={q.symbol} className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-mono font-bold">{q.displaySymbol}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{q.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono">{fmtPrice(q.price)}</span>
                    <Badge className="ml-2 bg-success/10 text-success border-0 text-xs">
                      +{q.changePct.toFixed(2)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-destructive/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-destructive flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Top Losers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {losers.map((q) => (
                <div key={q.symbol} className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-mono font-bold">{q.displaySymbol}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{q.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono">{fmtPrice(q.price)}</span>
                    <Badge className="ml-2 bg-destructive/10 text-destructive border-0 text-xs">
                      {q.changePct.toFixed(2)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search stocks by name or symbol..."
            className="pl-9 font-mono"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {SECTORS.slice(0, 8).map((s) => (
            <Button
              key={s}
              variant={sector === s && !searchQ ? "default" : "outline"}
              size="sm"
              className="text-xs h-8"
              onClick={() => {
                setSearchQ("");
                setSector(s);
              }}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* More sector buttons */}
      <div className="flex gap-1 flex-wrap">
        {SECTORS.slice(8).map((s) => (
          <Button
            key={s}
            variant={sector === s && !searchQ ? "default" : "outline"}
            size="sm"
            className="text-xs h-8"
            onClick={() => {
              setSearchQ("");
              setSector(s);
            }}
          >
            {s}
          </Button>
        ))}
      </div>

      {/* Stocks Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            {searchQ
              ? `Search results for "${searchQ}"`
              : sector === "All"
              ? "Market Overview"
              : `${sector} Sector`}
            <span className="text-muted-foreground font-normal">
              ({displayQuotes.length} stocks)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="font-mono text-xs text-muted-foreground pl-6">SYMBOL</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">NAME</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">SECTOR</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground text-right">PRICE</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground text-right">CHANGE %</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground text-right">AVG VOLUME</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground text-right pr-6">MKT CAP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading || searchLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : displayQuotes.length === 0
                ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                        No stocks found
                      </TableCell>
                    </TableRow>
                  )
                : displayQuotes.map((q) => {
                    const positive = q.changePct >= 0;
                    return (
                      <TableRow key={q.symbol} className="border-border/30 hover:bg-muted/20">
                        <TableCell className="font-mono font-bold text-sm pl-6">
                          {q.displaySymbol}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">
                          {q.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-normal">
                            {q.sector}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {fmtPrice(q.price)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={cn(
                              "font-mono text-sm font-medium",
                              positive ? "text-success" : "text-destructive"
                            )}
                          >
                            {positive ? "+" : ""}
                            {q.changePct.toFixed(2)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {fmtVol(q.volume)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground pr-6">
                          {fmtCap(q.marketCap)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
