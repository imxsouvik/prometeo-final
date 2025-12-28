import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Ban,
  RefreshCw,
  Loader2,
  Shield,
  Filter,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Layout } from "@/components/Layout";
import { AdminAccountCard } from "@/components/super-admin/AdminAccountCard";
import { VerificationIdModal } from "@/components/super-admin/VerificationIdModal";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAccounts, type AdminAccount } from "@/hooks/useAdminAccounts";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | AdminAccount["status"];

export default function SuperAdminPanel() {
  const navigate = useNavigate();
  const { user, userRole, loading: authLoading } = useAuth();
  const { accounts, loading: accountsLoading, updateAccountStatus, refetch } = useAdminAccounts();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AdminAccount | null>(null);

  // Auth check - only super_admin can access
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/login");
        return;
      }
      if (userRole !== "super_admin") {
        navigate("/");
        return;
      }
    }
  }, [user, userRole, authLoading, navigate]);

  const handleViewVerification = (account: AdminAccount) => {
    setSelectedAccount(account);
    setVerificationModalOpen(true);
  };

  const handleStatusChange = async (account: AdminAccount, newStatus: AdminAccount["status"]) => {
    await updateAccountStatus(account.id, newStatus);
  };

  const filteredAccounts =
    statusFilter === "all"
      ? accounts
      : accounts.filter((a) => a.status === statusFilter);

  const stats = {
    total: accounts.length,
    pending: accounts.filter((a) => a.status === "pending").length,
    approved: accounts.filter((a) => a.status === "approved").length,
    rejected: accounts.filter((a) => a.status === "rejected").length,
    suspended: accounts.filter((a) => a.status === "suspended").length,
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user || userRole !== "super_admin") {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 p-6 rounded-xl bg-[#0E0E55]">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/10">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Super Admin Panel</h1>
              <p className="text-white/70 text-sm">
                Manage admin registrations and account statuses
              </p>
            </div>
          </div>

          <Button variant="outline" onClick={refetch} className="bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Card
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              statusFilter === "all" && "ring-2 ring-primary"
            )}
            onClick={() => setStatusFilter("all")}
          >
            <CardContent className="p-4 text-center">
              <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              statusFilter === "pending" && "ring-2 ring-yellow-500",
              stats.pending > 0 && "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
            )}
            onClick={() => setStatusFilter("pending")}
          >
            <CardContent className="p-4 text-center">
              <Clock className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              statusFilter === "approved" && "ring-2 ring-success"
            )}
            onClick={() => setStatusFilter("approved")}
          >
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-5 w-5 mx-auto mb-1 text-success" />
              <div className="text-2xl font-bold text-success">{stats.approved}</div>
              <p className="text-xs text-muted-foreground">Approved</p>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              statusFilter === "rejected" && "ring-2 ring-destructive"
            )}
            onClick={() => setStatusFilter("rejected")}
          >
            <CardContent className="p-4 text-center">
              <XCircle className="h-5 w-5 mx-auto mb-1 text-destructive" />
              <div className="text-2xl font-bold text-destructive">{stats.rejected}</div>
              <p className="text-xs text-muted-foreground">Rejected</p>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              statusFilter === "suspended" && "ring-2 ring-gray-500"
            )}
            onClick={() => setStatusFilter("suspended")}
          >
            <CardContent className="p-4 text-center">
              <Ban className="h-5 w-5 mx-auto mb-1 text-gray-500" />
              <div className="text-2xl font-bold text-gray-500">{stats.suspended}</div>
              <p className="text-xs text-muted-foreground">Suspended</p>
            </CardContent>
          </Card>
        </div>

        {/* Accounts List */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Admin Accounts
                {statusFilter !== "all" && (
                  <Badge variant="secondary" className="ml-2 capitalize">
                    {statusFilter}
                  </Badge>
                )}
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                {filteredAccounts.length} account{filteredAccounts.length !== 1 ? "s" : ""}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {accountsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  {statusFilter === "all"
                    ? "No admin accounts yet"
                    : `No ${statusFilter} accounts`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAccounts.map((account) => (
                  <AdminAccountCard
                    key={account.id}
                    account={account}
                    onStatusChange={(status) => handleStatusChange(account, status)}
                    onViewVerification={() => handleViewVerification(account)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Verification ID Modal */}
      <VerificationIdModal
        account={selectedAccount}
        open={verificationModalOpen}
        onClose={() => {
          setVerificationModalOpen(false);
          setSelectedAccount(null);
        }}
      />
    </Layout>
  );
}
