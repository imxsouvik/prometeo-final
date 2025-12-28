import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface UserProfile {
  name: string;
  phone: string;
  email: string;
}

export function useUserProfile() {
  const { user, userRole } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First try to get from profiles table (regular users)
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("name, phone, email")
        .eq("user_id", user.id)
        .single();

      if (profileData && !profileError) {
        setProfile(profileData);
        setLoading(false);
        return;
      }

      // If not found, try admin_profiles table
      const { data: adminData, error: adminError } = await supabase
        .from("admin_profiles")
        .select("name, phone, email")
        .eq("user_id", user.id)
        .single();

      if (adminData && !adminError) {
        setProfile(adminData);
        setLoading(false);
        return;
      }

      // No profile found
      setError("Profile not found");
      setProfile(null);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
}
