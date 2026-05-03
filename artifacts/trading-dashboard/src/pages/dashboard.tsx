import { 
  useGetDashboardSummary, 
  useGetLatestSignal, 
  useGetPnlChart 
} from "@workspace/api-client-react";
import { formatCurrency, formatPercent, formatNumber, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";
import { ArrowUpRight, ArrowDownRight, Activity, Target, AlertTriangle } from "lucide-react";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: latestSignal, isLoading: loadingSignal } = useGetLatestSignal();
  const { data: pnlData, isLoading: loadingPnl } = useGetPnlChart({ days: 30 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Terminal Overview</h1>
        <div className="text-sm font-mono text-muted-foreground bg-muted/50 px-3 py-1 rounded-md border border-border">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard 
          title="Total P&L" 
          value={summary?.totalPnl} 
          formatter={formatCurrency}
          trend={summary?.totalPnl ? summary.totalPnl > 0 : undefined}
          isLoading={loadingSummary}
          subtitle={summary?.totalPnlPercent ? `${formatPercent(summary.totalPnlPercent)} return` : undefined}
        />
        <MetricCard 
          title="Win Rate" 
          value={summary?.winRate} 
          formatter={(v) => formatPercent(v)}
          isLoading={loadingSummary}
          subtitle={`${summary?.winningTrades || 0}W / ${summary?.losingTrades || 0}L`}
        />
        <MetricCard 
          title="Open Positions" 
          value={summary?.openTrades} 
          formatter={(v) => v?.toString() || "0"}
          isLoading={loadingSummary}
          subtitle="Currently active"
        />
        <MetricCard 
          title="Current Capital" 
          value={summary?.currentCapital} 
          formatter={formatCurrency}
          isLoading={loadingSummary}
          subtitle="Available balance"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main P&L Chart */}
        <Card className="lg:col-span-2 flex flex-col bg-card/50 border-border/50">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Cumulative Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 min-h-[350px]">
            {loadingPnl ? (
              <div className="p-6 h-full flex flex-col gap-4">
                <Skeleton className="w-full flex-1 rounded-lg" />
              </div>
            ) : pnlData && pnlData.length > 0 ? (
              <div className="h-full w-full p-4" data-testid="chart-pnl">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={pnlData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      dy={10}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `₹${val/1000}k`}
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      labelFormatter={(val) => formatDate(val)}
                      formatter={(val: number) => [formatCurrency(val), 'Cumulative P&L']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cumulativePnl" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#pnlGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No performance data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Engine & Signal Status */}
        <div className="space-y-6">
          
          {/* Latest Signal Summary */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Latest Signal
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {loadingSignal ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : latestSignal ? (
                <div className="space-y-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <h2 className="text-3xl font-bold font-mono" data-testid="text-latest-symbol">
                        {latestSignal.symbol}
                      </h2>
                      <div className="text-sm text-muted-foreground mt-1">
                        {formatDate(latestSignal.timestamp)}
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-lg px-4 py-1.5 font-bold ${
                        latestSignal.direction === 'LONG' ? 'bg-success/10 text-success border-success/20' : 
                        latestSignal.direction === 'SHORT' ? 'bg-destructive/10 text-destructive border-destructive/20' : 
                        'bg-warning/10 text-warning border-warning/20'
                      }`}
                      data-testid={`badge-signal-${latestSignal.direction.toLowerCase()}`}
                    >
                      {latestSignal.direction}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                    <div>
                      <div className="text-xs text-muted-foreground">Price</div>
                      <div className="font-mono text-lg">{formatCurrency(latestSignal.price)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Total Score</div>
                      <div className="font-mono text-lg">{latestSignal.totalScore}</div>
                    </div>
                    {latestSignal.stopLoss && (
                      <div>
                        <div className="text-xs text-muted-foreground">Stop Loss</div>
                        <div className="font-mono text-destructive">{formatCurrency(latestSignal.stopLoss)}</div>
                      </div>
                    )}
                    {latestSignal.takeProfit && (
                      <div>
                        <div className="text-xs text-muted-foreground">Take Profit</div>
                        <div className="font-mono text-success">{formatCurrency(latestSignal.takeProfit)}</div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No signals generated yet.</div>
              )}
            </CardContent>
          </Card>

          {/* Engine Scores Panel */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4" />
                Engine Matrix
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-0">
              {loadingSignal ? (
                <div className="p-4 space-y-3">
                  {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : latestSignal?.engines ? (
                <div className="divide-y divide-border/50">
                  {latestSignal.engines.map((engine) => (
                    <div key={engine.name} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                      <div className="font-medium text-sm">{engine.name}</div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-muted-foreground">{formatNumber(engine.score, 1)}</span>
                        <Badge 
                          variant="outline" 
                          className={`w-16 justify-center ${
                            engine.status === 'BULL' ? 'text-success border-success/30' : 
                            engine.status === 'BEAR' ? 'text-destructive border-destructive/30' : 
                            'text-muted-foreground border-border'
                          }`}
                        >
                          {engine.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Engine data unavailable
                </div>
              )}
            </CardContent>
          </Card>
          
        </div>
      </div>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  formatter, 
  trend, 
  isLoading,
  subtitle
}: { 
  title: string; 
  value?: number | null; 
  formatter: (v: number | null | undefined) => string;
  trend?: boolean;
  isLoading?: boolean;
  subtitle?: string;
}) {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="p-6">
        <div className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">{title}</div>
        {isLoading ? (
          <Skeleton className="h-8 w-24 mb-1" />
        ) : (
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold font-mono tracking-tight" data-testid={`metric-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
              {formatter(value)}
            </div>
            {trend !== undefined && value !== 0 && (
              trend ? 
                <ArrowUpRight className="w-5 h-5 text-success" /> : 
                <ArrowDownRight className="w-5 h-5 text-destructive" />
            )}
          </div>
        )}
        {subtitle && !isLoading && (
          <div className="text-xs text-muted-foreground mt-1 font-mono">{subtitle}</div>
        )}
      </CardContent>
    </Card>
  );
}
