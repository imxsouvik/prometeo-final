import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export interface UserIncident {
  id: string;
  reporter_id: string;
  reporter_name: string;
  reporter_phone: string;
  gps_lat: number;
  gps_lng: number;
  gps_address: string | null;
  report_type: "medical" | "fire" | "crime" | "accident" | "other";
  video_url: string;
  video_thumbnail_url: string | null;
  description: string;
  notify_hospital: boolean;
  notify_fire_station: boolean;
  notify_police: boolean;
  status: "pending" | "seen" | "responding" | "resolved";
  created_at: string;
  updated_at: string;
}

export function useUserIncidents() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<UserIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserIncidents = useCallback(async () => {
    if (!user) {
      setIncidents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("incidents")
        .select("*")
        .eq("reporter_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setIncidents((data as UserIncident[]) || []);
    } catch (err) {
      console.error("Error fetching user incidents:", err);
      setError("Failed to load your reports");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchUserIncidents();
  }, [fetchUserIncidents]);

  // Realtime subscription for user's own incidents
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user-incidents:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "incidents",
          filter: `reporter_id=eq.${user.id}`,
        },
        (payload: RealtimePostgresChangesPayload<UserIncident>) => {
          if (payload.eventType === "INSERT") {
            const newIncident = payload.new as UserIncident;
            setIncidents((prev) => [newIncident, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            const updatedIncident = payload.new as UserIncident;
            setIncidents((prev) =>
              prev.map((incident) =>
                incident.id === updatedIncident.id ? updatedIncident : incident
              )
            );
          } else if (payload.eventType === "DELETE") {
            const deletedIncident = payload.old as UserIncident;
            setIncidents((prev) =>
              prev.filter((incident) => incident.id !== deletedIncident.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    incidents,
    loading,
    error,
    refetch: fetchUserIncidents,
  };
}
