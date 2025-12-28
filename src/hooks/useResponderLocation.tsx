import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdminProfile } from "@/hooks/useAdminProfile";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export interface ResponderLocation {
  id: string;
  incident_id: string;
  responder_id: string;
  responder_name: string;
  department: string;
  gps_lat: number;
  gps_lng: number;
  updated_at: string;
  created_at: string;
}

interface UseResponderLocationOptions {
  incidentId?: string;
  trackingEnabled?: boolean;
}

export function useResponderLocation(options: UseResponderLocationOptions = {}) {
  const { incidentId, trackingEnabled = false } = options;
  const { user } = useAuth();
  const { profile: adminProfile } = useAdminProfile();
  const [responderLocations, setResponderLocations] = useState<ResponderLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentLocationIdRef = useRef<string | null>(null);

  // Fetch responder locations for an incident (for users)
  const fetchResponderLocations = useCallback(async (targetIncidentId: string) => {
    if (!targetIncidentId) return;

    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from("responder_locations")
        .select("*")
        .eq("incident_id", targetIncidentId);

      if (fetchError) throw fetchError;
      setResponderLocations((data as ResponderLocation[]) || []);
    } catch (err) {
      console.error("Error fetching responder locations:", err);
      setError("Failed to load responder locations");
    } finally {
      setLoading(false);
    }
  }, []);

  // Start tracking admin location
  const startTracking = useCallback(async (targetIncidentId: string) => {
    if (!user || !adminProfile) return;

    // Get current position and send to database
    const updateLocation = async () => {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        });

        const locationData = {
          incident_id: targetIncidentId,
          responder_id: user.id,
          responder_name: adminProfile.name,
          department: adminProfile.department,
          gps_lat: position.coords.latitude,
          gps_lng: position.coords.longitude,
          updated_at: new Date().toISOString(),
        };

        if (currentLocationIdRef.current) {
          // Update existing location
          await supabase
            .from("responder_locations")
            .update({
              gps_lat: locationData.gps_lat,
              gps_lng: locationData.gps_lng,
              updated_at: locationData.updated_at,
            })
            .eq("id", currentLocationIdRef.current);
        } else {
          // Insert new location
          const { data, error: insertError } = await supabase
            .from("responder_locations")
            .insert(locationData)
            .select()
            .single();

          if (insertError) throw insertError;
          if (data) {
            currentLocationIdRef.current = data.id;
          }
        }
      } catch (err) {
        console.error("Error updating location:", err);
      }
    };

    // Initial update
    await updateLocation();

    // Update every 5 seconds
    locationIntervalRef.current = setInterval(updateLocation, 5000);
  }, [user, adminProfile]);

  // Stop tracking
  const stopTracking = useCallback(async () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }

    // Delete location from database
    if (currentLocationIdRef.current) {
      await supabase
        .from("responder_locations")
        .delete()
        .eq("id", currentLocationIdRef.current);
      currentLocationIdRef.current = null;
    }
  }, []);

  // Subscribe to realtime updates for responder locations
  useEffect(() => {
    if (!incidentId) return;

    // Initial fetch
    fetchResponderLocations(incidentId);

    // Subscribe to changes
    const channel = supabase
      .channel(`responder-locations:${incidentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "responder_locations",
          filter: `incident_id=eq.${incidentId}`,
        },
        (payload: RealtimePostgresChangesPayload<ResponderLocation>) => {
          if (payload.eventType === "INSERT") {
            const newLocation = payload.new as ResponderLocation;
            setResponderLocations((prev) => {
              const exists = prev.find((l) => l.id === newLocation.id);
              if (exists) return prev;
              return [...prev, newLocation];
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedLocation = payload.new as ResponderLocation;
            setResponderLocations((prev) =>
              prev.map((loc) =>
                loc.id === updatedLocation.id ? updatedLocation : loc
              )
            );
          } else if (payload.eventType === "DELETE") {
            const deletedLocation = payload.old as ResponderLocation;
            setResponderLocations((prev) =>
              prev.filter((loc) => loc.id !== deletedLocation.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [incidentId, fetchResponderLocations]);

  // Handle tracking state changes
  useEffect(() => {
    if (trackingEnabled && incidentId) {
      startTracking(incidentId);
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [trackingEnabled, incidentId, startTracking, stopTracking]);

  return {
    responderLocations,
    loading,
    error,
    startTracking,
    stopTracking,
  };
}
