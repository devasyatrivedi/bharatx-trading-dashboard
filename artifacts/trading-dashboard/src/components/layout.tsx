import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Activity, 
  ListOrdered, 
  BarChart3, 
  TrendingUp,
  ServerCrash
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHealthCheck } from "@workspace/api-client-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: health } = useHealthCheck({ query: { refetchInterval: 30000 } });

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/signals", label: "Signals", icon: Activity },
    { href: "/trades", label: "Paper Trades", icon: ListOrdered },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/market", label: "NSE Market", icon: TrendingUp },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <aside className="w-64 flex-shrink-0 border-r border-border bg-card/50 flex flex-col backdrop-blur-xl">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2 font-mono font-bold tracking-tighter text-xl">
            <span className="text-primary">Bharat</span>
            <span className="text-foreground">X</span>
            <span className="text-muted-foreground text-xs ml-2 rounded-full border px-2 py-0.5">DEV</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                data-testid={`link-nav-${item.label.toLowerCase().replace(' ', '-')}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-mono">SYSTEM STATUS</span>
            {health?.status === "ok" ? (
              <div className="flex items-center gap-1.5 text-success" data-testid="status-system-ok">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                </span>
                <span className="font-mono font-medium">ONLINE</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-destructive" data-testid="status-system-error">
                <ServerCrash className="w-3 h-3" />
                <span className="font-mono font-medium">OFFLINE</span>
              </div>
            )}
          </div>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
