import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import type { Incident } from "@/hooks/useIncidents";

// Extend Leaflet types for routing machine
declare module "leaflet" {
  namespace Routing {
    interface ControlOptions {
      waypoints: L.LatLng[];
      routeWhileDragging?: boolean;
      addWaypoints?: boolean;
      fitSelectedRoutes?: boolean;
      showAlternatives?: boolean;
      lineOptions?: {
        styles?: Array<{ color: string; weight: number; opacity: number }>;
        extendToWaypoints?: boolean;
        missingRouteTolerance?: number;
      };
    }

    interface Control extends L.Control {
      getContainer(): HTMLElement | undefined;
    }

    function control(options: ControlOptions): Control;
  }
}

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const reportTypeColors: Record<Incident["report_type"], string> = {
  medical: "#ef4444",
  fire: "#f97316",
  crime: "#a855f7",
  accident: "#eab308",
  other: "#6b7280",
};

const reportTypeIcons: Record<Incident["report_type"], string> = {
  medical: "🏥",
  fire: "🔥",
  crime: "🚨",
  accident: "🚗",
  other: "❓",
};

interface IncidentMapProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onIncidentSelect: (incident: Incident) => void;
  adminLocation: { lat: number; lng: number } | null;
  showRouting?: boolean;
}

export function IncidentMap({
  incidents,
  selectedIncident,
  onIncidentSelect,
  adminLocation,
  showRouting = false,
}: IncidentMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routingControlRef = useRef<L.Control | null>(null);
  const adminMarkerRef = useRef<L.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current).setView([40.7128, -74.006], 10);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when incidents change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add incident markers
    incidents.forEach((incident) => {
      const color = reportTypeColors[incident.report_type];
      const icon = reportTypeIcons[incident.report_type];

      const customIcon = L.divIcon({
        className: "custom-incident-marker",
        html: `
          <div style="
            background-color: ${color};
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            border: 3px solid white;
            ${selectedIncident?.id === incident.id ? "transform: scale(1.3); z-index: 1000;" : ""}
          ">
            ${icon}
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([incident.gps_lat, incident.gps_lng], { icon: customIcon })
        .addTo(mapRef.current!)
        .bindPopup(`
          <div style="min-width: 200px;">
            <strong style="font-size: 14px;">${icon} ${incident.report_type.toUpperCase()}</strong>
            <p style="margin: 8px 0; font-size: 12px; color: #666;">
              ${incident.description.slice(0, 100)}${incident.description.length > 100 ? "..." : ""}
            </p>
            <p style="margin: 4px 0; font-size: 11px; color: #888;">
              Reporter: ${incident.reporter_name}
            </p>
            <p style="margin: 4px 0; font-size: 11px; color: #888;">
              Status: <strong>${incident.status}</strong>
            </p>
          </div>
        `);

      marker.on("click", () => onIncidentSelect(incident));
      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (incidents.length > 0) {
      const bounds = L.latLngBounds(
        incidents.map((i) => [i.gps_lat, i.gps_lng] as [number, number])
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [incidents, selectedIncident, onIncidentSelect]);

  // Update admin location marker
  useEffect(() => {
    if (!mapRef.current) return;

    if (adminMarkerRef.current) {
      adminMarkerRef.current.remove();
      adminMarkerRef.current = null;
    }

    if (adminLocation) {
      const adminIcon = L.divIcon({
        className: "admin-location-marker",
        html: `
          <div style="
            background-color: #2563eb;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 0 8px rgba(37, 99, 235, 0.3);
            border: 3px solid white;
          ">
            <div style="
              width: 8px;
              height: 8px;
              background: white;
              border-radius: 50%;
            "></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      adminMarkerRef.current = L.marker([adminLocation.lat, adminLocation.lng], {
        icon: adminIcon,
      })
        .addTo(mapRef.current)
        .bindPopup("Your Location");
    }
  }, [adminLocation]);

  // Handle routing
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing routing
    if (routingControlRef.current) {
      mapRef.current.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    // Add routing if conditions are met
    if (showRouting && adminLocation && selectedIncident) {
      routingControlRef.current = L.Routing.control({
        waypoints: [
          L.latLng(adminLocation.lat, adminLocation.lng),
          L.latLng(selectedIncident.gps_lat, selectedIncident.gps_lng),
        ],
        routeWhileDragging: false,
        addWaypoints: false,
        fitSelectedRoutes: true,
        showAlternatives: false,
        lineOptions: {
          styles: [{ color: "#2563eb", weight: 4, opacity: 0.8 }],
          extendToWaypoints: true,
          missingRouteTolerance: 0,
        },
      }).addTo(mapRef.current);

      // Hide the routing panel
      const container = routingControlRef.current.getContainer();
      if (container) {
        container.style.display = "none";
      }
    }
  }, [showRouting, adminLocation, selectedIncident]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full rounded-lg overflow-hidden relative z-0"
      style={{ minHeight: "400px" }}
    />
  );
}
