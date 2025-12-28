import { formatDistanceToNow } from "date-fns";
import { MapPin, Phone, User, Clock, Video, Eye, Truck, CheckCircle, QrCode } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Incident } from "@/hooks/useIncidents";
import { cn } from "@/lib/utils";

const reportTypeConfig: Record<
  Incident["report_type"],
  { icon: string; label: string; color: string }
> = {
  medical: { icon: "🏥", label: "Medical", color: "bg-red-500" },
  fire: { icon: "🔥", label: "Fire", color: "bg-orange-500" },
  crime: { icon: "🚨", label: "Crime", color: "bg-purple-500" },
  accident: { icon: "🚗", label: "Accident", color: "bg-yellow-500" },
  other: { icon: "❓", label: "Other", color: "bg-gray-500" },
};

const statusConfig: Record<
  Incident["status"],
  { label: string; color: string; icon: React.ElementType }
> = {
  pending: { label: "Pending", color: "bg-destructive", icon: Clock },
  seen: { label: "Seen", color: "bg-blue-500", icon: Eye },
  responding: { label: "Responding", color: "bg-warning", icon: Truck },
  resolved: { label: "Resolved", color: "bg-success", icon: CheckCircle },
};

interface IncidentCardProps {
  incident: Incident;
  isSelected: boolean;
  onSelect: () => void;
  onStatusChange: (status: Incident["status"]) => void;
  onViewVideo: () => void;
  onShowQRCode: () => void;
}

export function IncidentCard({
  incident,
  isSelected,
  onSelect,
  onStatusChange,
  onViewVideo,
  onShowQRCode,
}: IncidentCardProps) {
  const reportType = reportTypeConfig[incident.report_type];
  const status = statusConfig[incident.status];
  const StatusIcon = status.icon;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md w-full overflow-hidden",
        isSelected && "ring-2 ring-primary shadow-lg"
      )}
      onClick={onSelect}
    >
      <CardContent className="p-3 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{reportType.icon}</span>
            <div>
              <h3 className="font-semibold text-sm text-card-foreground">{reportType.label} Emergency</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <Badge className={cn("text-white shrink-0", status.color)}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {incident.description}
        </p>

        {/* Reporter Info */}
        <div className="space-y-1 mb-3">
          <p className="text-xs flex items-center gap-2 text-card-foreground">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium">{incident.reporter_name}</span>
          </p>
          <p className="text-xs flex items-center gap-2 text-card-foreground">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span>{incident.reporter_phone}</span>
          </p>
          <p className="text-xs flex items-center gap-2 text-muted-foreground min-w-0">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate block">
              {incident.gps_address || `${incident.gps_lat.toFixed(4)}, ${incident.gps_lng.toFixed(4)}`}
            </span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-1.5 w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" className="px-2" onClick={onViewVideo}>
            <Video className="h-3 w-3 mr-1" />
            Video
          </Button>

          <Button size="sm" variant="outline" className="px-2" onClick={onShowQRCode}>
            <QrCode className="h-3 w-3 mr-1" />
            QR
          </Button>

          {incident.status === "pending" && (
            <Button
              size="sm"
              className="flex-1 min-w-0 bg-blue-500 text-white hover:bg-blue-600"
              onClick={() => onStatusChange("seen")}
            >
              <Eye className="h-3 w-3 mr-1 shrink-0" />
              <span className="truncate">Mark Seen</span>
            </Button>
          )}

          {incident.status === "seen" && (
            <Button
              size="sm"
              className="flex-1 min-w-0 bg-warning text-warning-foreground hover:bg-warning/90"
              onClick={() => onStatusChange("responding")}
            >
              <Truck className="h-3 w-3 mr-1 shrink-0" />
              <span className="truncate">Respond</span>
            </Button>
          )}

          {incident.status === "responding" && (
            <Button
              size="sm"
              className="flex-1 min-w-0 bg-success text-success-foreground hover:bg-success/90"
              onClick={() => onStatusChange("resolved")}
            >
              <CheckCircle className="h-3 w-3 mr-1 shrink-0" />
              <span className="truncate">Resolve</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
