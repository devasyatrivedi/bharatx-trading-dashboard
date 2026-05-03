import { useGetEngineAccuracy, useGetDashboardSummary } from "@workspace/api-client-react";
import { formatPercent, formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, Target, Crosshair } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function AnalyticsPage() {
  const { data: engineStats, isLoading: loadingEngines } = useGetEngineAccuracy();
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Strategy Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm">Deep dive into engine performance and trade statistics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Engine Performance */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Engine Accuracy
            </CardTitle>
            <CardDescription>Win rate per individual technical indicator</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {loadingEngines ? (
              <div className="space-y-6">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between"><Skeleton className="h-4 w-24"/><Skeleton className="h-4 w-12"/></div>
                    <Skeleton className="h-2 w-full"/>
                  </div>
                ))}
              </div>
            ) : engineStats && engineStats.length > 0 ? (
              <div className="space-y-6">
                {engineStats.sort((a,b) => b.accuracy - a.accuracy).map(engine => (
                  <div key={engine.engine} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{engine.engine}</span>
                      <span className="font-mono text-muted-foreground">{formatPercent(engine.accuracy * 100)}</span>
                    </div>
                    <Progress 
                      value={engine.accuracy * 100} 
                      className="h-2 bg-muted"
                      indicatorColor={
                        engine.accuracy > 0.6 ? "bg-success" : 
                        engine.accuracy > 0.4 ? "bg-warning" : 
                        "bg-destructive"
                      }
                    />
                    <div className="flex justify-between text-xs text-muted-foreground font-mono">
                      <span>BULL: {engine.bullSignals}</span>
                      <span>BEAR: {engine.bearSignals}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No engine data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trade Statistics */}
        <div className="space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Execution Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {loadingSummary ? (
                <div className="space-y-4">
                  {[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full"/>)}
                </div>
              ) : summary ? (
                <div className="grid grid-cols-2 gap-4">
                  <StatBox label="Total Trades" value={summary.totalTrades.toString()} />
                  <StatBox label="Win Rate" value={formatPercent(summary.winRate)} highlight={summary.winRate > 50} />
                  <StatBox label="Winning Trades" value={summary.winningTrades.toString()} highlight={true} />
                  <StatBox label="Losing Trades" value={summary.losingTrades.toString()} highlight={false} />
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                P&L Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {loadingSummary ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full"/>)}
                </div>
              ) : summary ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md border border-border/50">
                    <span className="text-sm text-muted-foreground">Average P&L per Trade</span>
                    <span className={`font-mono font-medium ${summary.avgPnlPerTrade > 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(summary.avgPnlPerTrade)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-success/5 rounded-md border border-success/20">
                    <span className="text-sm text-success">Best Trade</span>
                    <span className="font-mono font-bold text-success">
                      +{formatCurrency(summary.bestTrade)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-destructive/5 rounded-md border border-destructive/20">
                    <span className="text-sm text-destructive">Worst Trade</span>
                    <span className="font-mono font-bold text-destructive">
                      {formatCurrency(summary.worstTrade)}
                    </span>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, highlight }: { label: string, value: string, highlight?: boolean }) {
  return (
    <div className="bg-muted/30 p-4 rounded-md border border-border/50 flex flex-col items-center justify-center text-center">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={`text-2xl font-mono font-bold ${
        highlight === true ? 'text-success' : 
        highlight === false ? 'text-destructive' : 
        'text-foreground'
      }`}>
        {value}
      </div>
    </div>
  );
}
