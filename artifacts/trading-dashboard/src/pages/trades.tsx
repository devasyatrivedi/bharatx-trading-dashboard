import { useState } from "react";
import { 
  useListTrades, 
  useCreateTrade, 
  useCloseTrade,
  getListTradesQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetPnlChartQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  formatCurrency, 
  formatShortDate, 
  formatPercent 
} from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ListOrdered, Plus, X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const createTradeSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").toUpperCase(),
  direction: z.enum(["LONG", "SHORT"]),
  entryPrice: z.coerce.number().positive(),
  quantity: z.coerce.number().int().positive(),
  stopLoss: z.coerce.number().positive(),
  takeProfit: z.coerce.number().positive(),
});

const closeTradeSchema = z.object({
  exitPrice: z.coerce.number().positive(),
  closeReason: z.string().optional(),
});

export default function TradesPage() {
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: trades, isLoading } = useListTrades({ status: filter !== "all" ? filter : undefined });
  
  const createTrade = useCreateTrade();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const createForm = useForm<z.infer<typeof createTradeSchema>>({
    resolver: zodResolver(createTradeSchema),
    defaultValues: {
      symbol: "",
      direction: "LONG",
      entryPrice: 0,
      quantity: 1,
      stopLoss: 0,
      takeProfit: 0,
    },
  });

  function onCreateSubmit(values: z.infer<typeof createTradeSchema>) {
    createTrade.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTradesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setIsCreateOpen(false);
        createForm.reset();
        toast({ title: "Trade placed successfully" });
      },
      onError: (err: any) => {
        toast({ 
          title: "Failed to place trade", 
          description: err.message || "Unknown error",
          variant: "destructive"
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paper Trades</h1>
          <p className="text-muted-foreground mt-1 text-sm">Execution log and active positions.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="btn-new-trade" className="gap-2">
              <Plus className="w-4 h-4" />
              Manual Trade
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Place Paper Trade</DialogTitle>
              <DialogDescription>
                Manually enter a paper trade for tracking.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="symbol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Symbol</FormLabel>
                        <FormControl>
                          <Input placeholder="RELIANCE" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="direction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Direction</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select direction" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="LONG">LONG</SelectItem>
                            <SelectItem value="SHORT">SHORT</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="entryPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entry Price (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.05" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="stopLoss"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stop Loss (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.05" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="takeProfit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Take Profit (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.05" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createTrade.isPending} data-testid="btn-submit-trade">
                    {createTrade.isPending ? "Executing..." : "Execute Trade"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card/50 border-border/50 border-t-4 border-t-primary/50">
        <CardHeader className="py-4 border-b border-border/50 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-primary" />
            Trade Log
          </CardTitle>
          <div className="flex bg-muted/50 rounded-md p-1 border border-border">
            {(["all", "open", "closed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs font-medium rounded-sm capitalize transition-colors ${
                  filter === f ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[150px]">Opened</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Side</TableHead>
                <TableHead className="text-right">Entry</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Exit</TableHead>
                <TableHead className="text-right">P&L</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-6 w-16 mx-auto rounded-full" /></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))
              ) : !trades || trades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-48 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <ListOrdered className="w-8 h-8 text-muted mb-2" />
                      <p>No trades found matching filter.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                trades.map((trade) => (
                  <TradeRow key={trade.id} trade={trade} />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function TradeRow({ trade }: { trade: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const closeTrade = useCloseTrade();

  const closeForm = useForm<z.infer<typeof closeTradeSchema>>({
    resolver: zodResolver(closeTradeSchema),
    defaultValues: {
      exitPrice: trade.entryPrice, // default to entry for convenience
      closeReason: "Manual close",
    },
  });

  function onCloseSubmit(values: z.infer<typeof closeTradeSchema>) {
    closeTrade.mutate({ id: trade.id, data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTradesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPnlChartQueryKey() });
        setIsCloseOpen(false);
        toast({ title: "Trade closed successfully" });
      },
      onError: (err: any) => {
        toast({ 
          title: "Failed to close trade", 
          description: err.message || "Unknown error",
          variant: "destructive"
        });
      }
    });
  }

  const isWin = trade.pnl && trade.pnl > 0;
  const isLoss = trade.pnl && trade.pnl < 0;

  return (
    <TableRow className="group">
      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
        {formatShortDate(trade.openedAt)}
      </TableCell>
      <TableCell className="font-bold tracking-tight">
        {trade.symbol}
      </TableCell>
      <TableCell>
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-sm ${
          trade.direction === 'LONG' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
        }`}>
          {trade.direction}
        </span>
      </TableCell>
      <TableCell className="text-right font-mono text-sm">
        {formatCurrency(trade.entryPrice)}
      </TableCell>
      <TableCell className="text-right font-mono text-sm">
        {trade.quantity}
      </TableCell>
      <TableCell className="text-right font-mono text-sm">
        {trade.exitPrice ? formatCurrency(trade.exitPrice) : "—"}
      </TableCell>
      <TableCell className={`text-right font-mono text-sm font-medium ${
        isWin ? 'text-success' : isLoss ? 'text-destructive' : ''
      }`}>
        {trade.pnl ? (
          <div className="flex flex-col items-end">
            <span>{trade.pnl > 0 ? '+' : ''}{formatCurrency(trade.pnl)}</span>
            <span className="text-[10px] opacity-70">{trade.pnlPercent > 0 ? '+' : ''}{formatPercent(trade.pnlPercent)}</span>
          </div>
        ) : "—"}
      </TableCell>
      <TableCell className="text-center">
        <Badge variant="outline" className={
          trade.status === 'open' ? 'border-primary text-primary bg-primary/10' : 'border-muted text-muted-foreground'
        }>
          {trade.status}
        </Badge>
      </TableCell>
      <TableCell className="text-right pr-4">
        {trade.status === 'open' && (
          <Dialog open={isCloseOpen} onOpenChange={setIsCloseOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4 mr-1" />
                Close
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Close Trade: {trade.symbol}</DialogTitle>
                <DialogDescription>
                  Enter the exit price to close this position.
                </DialogDescription>
              </DialogHeader>
              <Form {...closeForm}>
                <form onSubmit={closeForm.handleSubmit(onCloseSubmit)} className="space-y-4">
                  <div className="bg-muted/50 p-3 rounded-md mb-4 text-sm flex justify-between items-center border border-border">
                    <span className="text-muted-foreground">Entry Price:</span>
                    <span className="font-mono">{formatCurrency(trade.entryPrice)}</span>
                  </div>
                  <FormField
                    control={closeForm.control}
                    name="exitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exit Price (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.05" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={closeForm.control}
                    name="closeReason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason</FormLabel>
                        <FormControl>
                          <Input placeholder="Hit target, Stop loss, Manual..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end pt-4">
                    <Button type="submit" variant="destructive" disabled={closeTrade.isPending}>
                      {closeTrade.isPending ? "Closing..." : "Close Position"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </TableCell>
    </TableRow>
  );
}
