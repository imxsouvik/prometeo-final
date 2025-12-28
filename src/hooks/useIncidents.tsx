import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export interface Incident {
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

export function useIncidents() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = useCallback(async () => {
    if (!user || (userRole !== "admin" && userRole !== "super_admin")) {
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
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setIncidents((data as Incident[]) || []);
    } catch (err) {
      console.error("Error fetching incidents:", err);
      setError("Failed to load incidents");
    } finally {
      setLoading(false);
    }
  }, [user, userRole]);

  const updateIncidentStatus = useCallback(
    async (incidentId: string, newStatus: Incident["status"], startLocationTracking?: () => void, stopLocationTracking?: () => void) => {
      if (!user) return false;

      try {
        // Get current incident
        const currentIncident = incidents.find((i) => i.id === incidentId);
        if (!currentIncident) return false;

        // Update incident status
        const { error: updateError } = await supabase
          .from("incidents")
          .update({ status: newStatus })
          .eq("id", incidentId);

        if (updateError) throw updateError;

        // Log status change
        const { error: logError } = await supabase
          .from("incident_status_logs")
          .insert({
            incident_id: incidentId,
            old_status: currentIncident.status,
            new_status: newStatus,
            changed_by: user.id,
          });

        if (logError) console.error("Failed to log status change:", logError);

        // Handle location tracking based on status
        if (newStatus === "responding" && startLocationTracking) {
          startLocationTracking();
        } else if ((newStatus === "resolved" || newStatus === "seen" || newStatus === "pending") && stopLocationTracking) {
          stopLocationTracking();
        }

        // Update local state
        setIncidents((prev) =>
          prev.map((incident) =>
            incident.id === incidentId
              ? { ...incident, status: newStatus }
              : incident
          )
        );

        toast({
          title: "Status updated",
          description: `Incident marked as ${newStatus}`,
        });

        return true;
      } catch (err) {
        console.error("Error updating status:", err);
        toast({
          title: "Update failed",
          description: "Failed to update incident status",
          variant: "destructive",
        });
        return false;
      }
    },
    [user, incidents, toast]
  );

  // Initial fetch
  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Realtime subscription
  useEffect(() => {
    if (!user || (userRole !== "admin" && userRole !== "super_admin")) return;

    const channel = supabase
      .channel("incidents-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "incidents",
        },
        (payload: RealtimePostgresChangesPayload<Incident>) => {
          if (payload.eventType === "INSERT") {
            const newIncident = payload.new as Incident;
            setIncidents((prev) => [newIncident, ...prev]);
            
            toast({
              title: "🚨 New Incident",
              description: `${newIncident.report_type.toUpperCase()} emergency reported`,
              variant: "destructive",
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedIncident = payload.new as Incident;
            setIncidents((prev) =>
              prev.map((incident) =>
                incident.id === updatedIncident.id ? updatedIncident : incident
              )
            );
          } else if (payload.eventType === "DELETE") {
            const deletedIncident = payload.old as Incident;
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
  }, [user, userRole, toast]);

  return {
    incidents,
    loading,
    error,
    refetch: fetchIncidents,
    updateIncidentStatus,
  };
}
