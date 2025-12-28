import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
  User,
  Phone,
  Mail,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  Ban,
  RefreshCw,
  Eye,
  FileImage,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { AdminAccount } from "@/hooks/useAdminAccounts";
import { cn } from "@/lib/utils";

const departmentConfig: Record<
  AdminAccount["department"],
  { label: string; icon: string; color: string }
> = {
  hospital: { label: "Hospital", icon: "🏥", color: "bg-red-100 text-red-700" },
  fire_station: { label: "Fire Station", icon: "🚒", color: "bg-orange-100 text-orange-700" },
  police: { label: "Police", icon: "🚔", color: "bg-blue-100 text-blue-700" },
};

const statusConfig: Record<
  AdminAccount["status"],
  { label: string; color: string; icon: React.ElementType }
> = {
  pending: { label: "Pending", color: "bg-yellow-500", icon: Clock },
  approved: { label: "Approved", color: "bg-success", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-destructive", icon: XCircle },
  suspended: { label: "Suspended", color: "bg-gray-500", icon: Ban },
};

interface AdminAccountCardProps {
  account: AdminAccount;
  onStatusChange: (status: AdminAccount["status"]) => void;
  onViewVerification: () => void;
}

export function AdminAccountCard({
  account,
  onStatusChange,
  onViewVerification,
}: AdminAccountCardProps) {
  const department = departmentConfig[account.department];
  const status = statusConfig[account.status];
  const StatusIcon = status.icon;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Main Info */}
          <div className="flex-1 p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-xl">
                  {department.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-card-foreground">{account.name}</h3>
                  <Badge className={cn("text-xs", department.color)}>
                    {department.label}
                  </Badge>
                </div>
              </div>
              <Badge className={cn("text-white", status.color)}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
            </div>

            {/* Contact Info */}
            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="truncate">{account.email}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{account.phone}</span>
              </div>
            </div>

            {/* Timestamps */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Applied {formatDistanceToNow(new Date(account.created_at), { addSuffix: true })}
              </span>
              <span>
                {format(new Date(account.created_at), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
          </div>

          {/* Actions Panel */}
          <div className="flex flex-row md:flex-col gap-2 p-4 bg-[#0E0E55] md:w-48 border-t md:border-t-0 md:border-l">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 md:w-full bg-[#0E0E55] text-white border-white/30 hover:bg-[#1a1a7a] hover:text-white"
              onClick={onViewVerification}
            >
              <FileImage className="h-4 w-4 mr-2" />
              View ID
            </Button>

            {account.status === "pending" && (
              <>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" className="flex-1 md:w-full bg-success hover:bg-success/90">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Approve Admin Account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will grant {account.name} full admin access to the{" "}
                        {department.label} department. They will be able to view and respond
                        to emergency incidents.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onStatusChange("approved")}
                        className="bg-success hover:bg-success/90"
                      >
                        Approve
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" className="flex-1 md:w-full">
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reject Admin Application?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will reject {account.name}'s admin application. They will not be
                        able to access admin features.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onStatusChange("rejected")}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Reject
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}

            {account.status === "approved" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" className="flex-1 md:w-full bg-[#0E0E55] text-white border-white/30 hover:bg-[#1a1a7a] hover:text-white">
                    <Ban className="h-4 w-4 mr-2" />
                    Suspend
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Suspend Admin Account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will temporarily revoke {account.name}'s admin access. They can be
                      re-activated later.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onStatusChange("suspended")}>
                      Suspend
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {(account.status === "rejected" || account.status === "suspended") && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" className="flex-1 md:w-full bg-[#0E0E55] text-white border-white/30 hover:bg-[#1a1a7a] hover:text-white">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Re-activate
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Re-activate Admin Account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will restore {account.name}'s admin access to the {department.label}{" "}
                      department.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onStatusChange("approved")}
                      className="bg-success hover:bg-success/90"
                    >
                      Re-activate
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
