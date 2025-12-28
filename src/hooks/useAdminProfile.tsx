import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AdminProfile {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email: string;
  department: "hospital" | "fire_station" | "police";
  verification_id_url: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  created_at: string;
}

export function useAdminProfile() {
  const { user, userRole } = useAuth();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user || userRole !== "admin") {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("admin_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setProfile(data as AdminProfile);
    } catch (err) {
      console.error("Error fetching admin profile:", err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user, userRole]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, refetch: fetchProfile };
}
