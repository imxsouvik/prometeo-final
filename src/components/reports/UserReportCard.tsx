import { formatDistanceToNow } from "date-fns";
import {
  Heart,
  Flame,
  Shield,
  Car,
  HelpCircle,
  Clock,
  Eye,
  Truck,
  CheckCircle,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UserIncident } from "@/hooks/useUserIncidents";

const reportTypeConfig = {
  medical: { icon: Heart, label: "Medical", color: "text-red-500" },
  fire: { icon: Flame, label: "Fire", color: "text-orange-500" },
  crime: { icon: Shield, label: "Crime", color: "text-blue-500" },
  accident: { icon: Car, label: "Accident", color: "text-yellow-500" },
  other: { icon: HelpCircle, label: "Other", color: "text-gray-500" },
};

const statusConfig = {
  pending: {
    label: "Pending",
    color: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
    icon: Clock,
    description: "Your report is waiting to be reviewed by emergency services.",
  },
  seen: {
    label: "Seen",
    color: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
    icon: Eye,
    description: "An administrator has reviewed your report.",
  },
  responding: {
    label: "Responding",
    color: "bg-purple-500/20 text-purple-700 dark:text-purple-400",
    icon: Truck,
    description: "Help is on the way! Emergency responders are coming to your location.",
  },
  resolved: {
    label: "Resolved",
    color: "bg-green-500/20 text-green-700 dark:text-green-400",
    icon: CheckCircle,
    description: "This incident has been resolved.",
  },
};

interface UserReportCardProps {
  incident: UserIncident;
  isSelected: boolean;
  onSelect: (incident: UserIncident) => void;
}

export function UserReportCard({ incident, isSelected, onSelect }: UserReportCardProps) {
  const TypeIcon = reportTypeConfig[incident.report_type]?.icon || HelpCircle;
  const typeConfig = reportTypeConfig[incident.report_type] || reportTypeConfig.other;
  const StatusIcon = statusConfig[incident.status]?.icon || Clock;
  const status = statusConfig[incident.status] || statusConfig.pending;

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "border-2 border-primary shadow-lg" : "border-2 border-transparent"
      }`}
      onClick={() => onSelect(incident)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TypeIcon className={`h-5 w-5 ${typeConfig.color}`} />
            <CardTitle className="text-base text-card-foreground">{typeConfig.label} Emergency</CardTitle>
          </div>
          <Badge className={status.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-card-foreground line-clamp-2">{incident.description}</p>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="line-clamp-1">
            {incident.gps_address || `${incident.gps_lat.toFixed(4)}, ${incident.gps_lng.toFixed(4)}`}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-sm text-card-foreground">{status.description}</p>
        </div>

        {incident.status === "responding" && (
          <Button variant="secondary" size="sm" className="w-full" onClick={() => onSelect(incident)}>
            <Truck className="h-4 w-4 mr-2" />
            View Responder on Map
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
