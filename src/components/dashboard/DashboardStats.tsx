import { Bell, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Incident } from "@/hooks/useIncidents";
import { cn } from "@/lib/utils";

interface DashboardStatsProps {
  incidents: Incident[];
}

export function DashboardStats({ incidents }: DashboardStatsProps) {
  const stats = {
    total: incidents.length,
    pending: incidents.filter((i) => i.status === "pending").length,
    seen: incidents.filter((i) => i.status === "seen").length,
    responding: incidents.filter((i) => i.status === "responding").length,
    resolved: incidents.filter((i) => i.status === "resolved").length,
  };

  const byType = {
    medical: incidents.filter((i) => i.report_type === "medical").length,
    fire: incidents.filter((i) => i.report_type === "fire").length,
    crime: incidents.filter((i) => i.report_type === "crime").length,
    accident: incidents.filter((i) => i.report_type === "accident").length,
    other: incidents.filter((i) => i.report_type === "other").length,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <Card className={cn(stats.pending > 0 && "border-destructive bg-destructive/5")}>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            {stats.pending > 0 && (
              <Bell className="h-4 w-4 text-destructive animate-pulse-emergency" />
            )}
            <span className="text-2xl font-bold text-card-foreground">{stats.pending}</span>
          </div>
          <p className="text-xs text-muted-foreground">Pending</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-500">{stats.seen}</div>
          <p className="text-xs text-muted-foreground">Seen</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-warning">{stats.responding}</div>
          <p className="text-xs text-muted-foreground">Responding</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-success">{stats.resolved}</div>
          <p className="text-xs text-muted-foreground">Resolved</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-card-foreground">{stats.total}</div>
          <p className="text-xs text-muted-foreground">Total</p>
        </CardContent>
      </Card>
    </div>
  );
}
