import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { UserIncident } from "@/hooks/useUserIncidents";
import { useResponderLocation, type ResponderLocation } from "@/hooks/useResponderLocation";

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const reportTypeColors: Record<string, string> = {
  medical: "#ef4444",
  fire: "#f97316",
  crime: "#3b82f6",
  accident: "#eab308",
  other: "#6b7280",
};

const reportTypeIcons: Record<string, string> = {
  medical: "🏥",
  fire: "🔥",
  crime: "🚔",
  accident: "🚗",
  other: "❓",
};

const statusColors: Record<string, string> = {
  pending: "#eab308",
  seen: "#3b82f6",
  responding: "#8b5cf6",
  resolved: "#22c55e",
};

const departmentIcons: Record<string, string> = {
  hospital: "🏥",
  fire_station: "🚒",
  police: "🚔",
};

interface UserReportMapProps {
  incident: UserIncident | null;
}

export function UserReportMap({ incident }: UserReportMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const responderMarkersRef = useRef<Map<string, L.Marker>>(new Map());

  // Subscribe to responder locations when incident is "responding"
  const { responderLocations } = useResponderLocation({
    incidentId: incident?.status === "responding" ? incident.id : undefined,
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current).setView([20.5937, 78.9629], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update marker when incident changes
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing marker
    if (markerRef.current) {
      mapRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }

    if (!incident) return;

    const color = reportTypeColors[incident.report_type] || "#6b7280";
    const icon = reportTypeIcons[incident.report_type] || "❓";
    const statusColor = statusColors[incident.status] || "#eab308";

    const customIcon = L.divIcon({
      html: `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          background: ${color};
          border-radius: 50%;
          border: 3px solid ${statusColor};
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          font-size: 20px;
        ">
          ${icon}
          ${
            incident.status === "responding"
              ? `<div style="
                  position: absolute;
                  top: -6px;
                  right: -6px;
                  width: 16px;
                  height: 16px;
                  background: #8b5cf6;
                  border-radius: 50%;
                  border: 2px solid white;
                  animation: pulse 1.5s infinite;
                "></div>`
              : ""
          }
        </div>
      `,
      className: "custom-marker",
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    markerRef.current = L.marker([incident.gps_lat, incident.gps_lng], { icon: customIcon })
      .addTo(mapRef.current)
      .bindPopup(
        `<div style="text-align: center;">
          <strong>${incident.report_type.toUpperCase()}</strong><br/>
          Status: <strong>${incident.status}</strong><br/>
          ${incident.gps_address || ""}
        </div>`
      );

    mapRef.current.setView([incident.gps_lat, incident.gps_lng], 15);
  }, [incident]);

  // Update responder markers
  useEffect(() => {
    if (!mapRef.current) return;

    const currentMarkers = responderMarkersRef.current;
    const newLocationIds = new Set(responderLocations.map((l) => l.id));

    // Remove markers for responders that are no longer tracking
    currentMarkers.forEach((marker, id) => {
      if (!newLocationIds.has(id)) {
        mapRef.current?.removeLayer(marker);
        currentMarkers.delete(id);
      }
    });

    // Add or update responder markers
    responderLocations.forEach((location) => {
      const deptIcon = departmentIcons[location.department] || "🚨";
      
      const responderIcon = L.divIcon({
        html: `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            background: #22c55e;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-size: 18px;
            animation: responderPulse 2s infinite;
          ">
            ${deptIcon}
          </div>
        `,
        className: "responder-marker",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      if (currentMarkers.has(location.id)) {
        // Update existing marker position
        currentMarkers.get(location.id)?.setLatLng([location.gps_lat, location.gps_lng]);
      } else {
        // Create new marker
        const marker = L.marker([location.gps_lat, location.gps_lng], { icon: responderIcon })
          .addTo(mapRef.current!)
          .bindPopup(
            `<div style="text-align: center;">
              <strong>${location.responder_name}</strong><br/>
              ${location.department.replace("_", " ").toUpperCase()}<br/>
              <small>Help is on the way!</small>
            </div>`
          );
        currentMarkers.set(location.id, marker);
      }
    });

    // Fit bounds to show both incident and responders
    if (incident && responderLocations.length > 0) {
      const bounds = L.latLngBounds([
        [incident.gps_lat, incident.gps_lng],
        ...responderLocations.map((l) => [l.gps_lat, l.gps_lng] as [number, number]),
      ]);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [responderLocations, incident]);

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.3); opacity: 0.7; }
          }
          @keyframes responderPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
            50% { box-shadow: 0 0 0 15px rgba(34, 197, 94, 0); }
          }
        `}
      </style>
      {incident?.status === "responding" && responderLocations.length > 0 && (
        <div className="absolute top-2 left-2 z-[1000] bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <span className="text-lg">🚨</span>
          <span className="font-medium">{responderLocations.length} Responder{responderLocations.length > 1 ? "s" : ""} on the way!</span>
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full rounded-lg" />
    </>
  );
}
