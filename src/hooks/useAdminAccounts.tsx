import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface AdminAccount {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email: string;
  department: "hospital" | "fire_station" | "police";
  verification_id_url: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  created_at: string;
  updated_at: string;
}

export function useAdminAccounts() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    if (!user || userRole !== "super_admin") {
      setAccounts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("admin_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setAccounts((data as AdminAccount[]) || []);
    } catch (err) {
      console.error("Error fetching admin accounts:", err);
      setError("Failed to load admin accounts");
    } finally {
      setLoading(false);
    }
  }, [user, userRole]);

  const updateAccountStatus = useCallback(
    async (accountId: string, newStatus: AdminAccount["status"]) => {
      if (!user || userRole !== "super_admin") return false;

      try {
        const { error: updateError } = await supabase
          .from("admin_profiles")
          .update({ status: newStatus })
          .eq("id", accountId);

        if (updateError) throw updateError;

        // Update local state
        setAccounts((prev) =>
          prev.map((account) =>
            account.id === accountId ? { ...account, status: newStatus } : account
          )
        );

        const statusMessages: Record<AdminAccount["status"], string> = {
          approved: "Admin account approved successfully",
          rejected: "Admin account rejected",
          suspended: "Admin account suspended",
          pending: "Admin account set to pending",
        };

        toast({
          title: "Status updated",
          description: statusMessages[newStatus],
        });

        return true;
      } catch (err) {
        console.error("Error updating account status:", err);
        toast({
          title: "Update failed",
          description: "Failed to update account status",
          variant: "destructive",
        });
        return false;
      }
    },
    [user, userRole, toast]
  );

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return {
    accounts,
    loading,
    error,
    refetch: fetchAccounts,
    updateAccountStatus,
  };
}
