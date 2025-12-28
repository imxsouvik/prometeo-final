import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  List,
  Map as MapIcon,
  RefreshCw,
  Building2,
  Loader2,
  Navigation,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Layout } from "@/components/Layout";
import { IncidentMap } from "@/components/dashboard/IncidentMap";
import { IncidentCard } from "@/components/dashboard/IncidentCard";
import { VideoPlayerModal } from "@/components/dashboard/VideoPlayerModal";
import { QRCodeModal } from "@/components/dashboard/QRCodeModal";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { useAuth } from "@/hooks/useAuth";
import { useAdminProfile } from "@/hooks/useAdminProfile";
import { useIncidents, type Incident } from "@/hooks/useIncidents";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useResponderLocation } from "@/hooks/useResponderLocation";
import { cn } from "@/lib/utils";

const departmentLabels: Record<string, string> = {
  hospital: "Hospital",
  fire_station: "Fire Station",
  police: "Police",
};

const departmentIcons: Record<string, string> = {
  hospital: "🏥",
  fire_station: "🚒",
  police: "🚔",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, userRole, adminStatus, loading: authLoading } = useAuth();
  const { profile: adminProfile, loading: profileLoading } = useAdminProfile();
  const { incidents, loading: incidentsLoading, updateIncidentStatus, refetch } = useIncidents();
  const geolocation = useGeolocation();

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoIncident, setVideoIncident] = useState<Incident | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrIncident, setQrIncident] = useState<Incident | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [showRouting, setShowRouting] = useState(false);
  const [trackingIncidentId, setTrackingIncidentId] = useState<string | null>(null);

  // Responder location tracking
  const { startTracking, stopTracking } = useResponderLocation({
    incidentId: trackingIncidentId || undefined,
    trackingEnabled: !!trackingIncidentId,
  });

  // Auth check
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/login");
        return;
      }
      if (userRole !== "admin" && userRole !== "super_admin") {
        navigate("/");
        return;
      }
      if (userRole === "admin" && adminStatus !== "approved") {
        navigate("/login");
        return;
      }
    }
  }, [user, userRole, adminStatus, authLoading, navigate]);

  // Request admin location
  useEffect(() => {
    if (user && !geolocation.latitude && !geolocation.loading) {
      geolocation.requestLocation();
    }
  }, [user]);

  const handleViewVideo = (incident: Incident) => {
    setVideoIncident(incident);
    setVideoModalOpen(true);
  };

  const handleShowQRCode = (incident: Incident) => {
    setQrIncident(incident);
    setQrModalOpen(true);
  };

  const handleStatusChange = useCallback(async (incident: Incident, newStatus: Incident["status"]) => {
    const startLocationTracking = () => setTrackingIncidentId(incident.id);
    const stopLocationTracking = () => setTrackingIncidentId(null);
    
    await updateIncidentStatus(incident.id, newStatus, startLocationTracking, stopLocationTracking);
  }, [updateIncidentStatus]);

  const adminLocation = geolocation.latitude && geolocation.longitude
    ? { lat: geolocation.latitude, lng: geolocation.longitude }
    : null;

  if (authLoading || profileLoading) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user || (userRole !== "admin" && userRole !== "super_admin")) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-[#0E0E55] rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="font-display text-2xl font-bold text-white">
                  {userRole === "super_admin" ? "Super Admin Dashboard" : "Admin Dashboard"}
                </h1>
                <p className="text-white/70 text-sm">
                  Monitor and respond to emergency incidents
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {adminProfile && (
                <Badge variant="secondary" className="text-sm py-1.5 px-3 bg-white/10 text-white border-white/20">
                  {departmentIcons[adminProfile.department]}{" "}
                  {departmentLabels[adminProfile.department]}
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={refetch} className="border-white/30 bg-white text-[#0E0E55] hover:bg-white/90">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <DashboardStats incidents={incidents} />

        {/* Location Status */}
        {!adminLocation && (
          <Alert className="mt-4">
            <Navigation className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Enable location to see routing to incidents</span>
              <Button size="sm" variant="outline" onClick={geolocation.requestLocation}>
                Enable Location
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <div className="mt-6 grid lg:grid-cols-3 gap-6">
          {/* Map / List View */}
          <div className="lg:col-span-2">
            <Card className="h-[600px]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Incidents Map</CardTitle>
                  <div className="flex items-center gap-2">
                    {selectedIncident && adminLocation && (
                      <Button
                        size="sm"
                        variant={showRouting ? "default" : "outline"}
                        onClick={() => setShowRouting(!showRouting)}
                      >
                        <Navigation className="h-4 w-4 mr-1" />
                        {showRouting ? "Hide Route" : "Show Route"}
                      </Button>
                    )}
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "map" | "list")}>
                      <TabsList className="h-8">
                        <TabsTrigger value="map" className="px-2 h-6">
                          <MapIcon className="h-4 w-4" />
                        </TabsTrigger>
                        <TabsTrigger value="list" className="px-2 h-6">
                          <List className="h-4 w-4" />
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-[calc(100%-60px)] p-2">
                {viewMode === "map" ? (
                  <IncidentMap
                    incidents={incidents}
                    selectedIncident={selectedIncident}
                    onIncidentSelect={setSelectedIncident}
                    adminLocation={adminLocation}
                    showRouting={showRouting}
                  />
                ) : (
                  <ScrollArea className="h-full pr-4">
                    <div className="space-y-3">
                      {incidents.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No incidents to display</p>
                        </div>
                      ) : (
                        incidents.map((incident) => (
                          <IncidentCard
                            key={incident.id}
                            incident={incident}
                            isSelected={selectedIncident?.id === incident.id}
                            onSelect={() => setSelectedIncident(incident)}
                            onStatusChange={(status) => handleStatusChange(incident, status)}
                            onViewVideo={() => handleViewVideo(incident)}
                            onShowQRCode={() => handleShowQRCode(incident)}
                          />
                        ))
                      )}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Incident List Sidebar */}
          <div className="lg:col-span-1">
            <Card className="h-[600px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <List className="h-5 w-5" />
                  Recent Incidents
                  {incidents.filter((i) => i.status === "pending").length > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {incidents.filter((i) => i.status === "pending").length} new
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[calc(100%-60px)] p-2">
                <ScrollArea className="h-full w-full">
                  <div className="space-y-3 pr-3">
                    {incidentsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : incidents.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No incidents yet</p>
                      </div>
                    ) : (
                      incidents.map((incident) => (
                        <IncidentCard
                          key={incident.id}
                          incident={incident}
                          isSelected={selectedIncident?.id === incident.id}
                          onSelect={() => {
                            setSelectedIncident(incident);
                            if (viewMode === "list") setViewMode("map");
                          }}
                          onStatusChange={(status) => handleStatusChange(incident, status)}
                          onViewVideo={() => handleViewVideo(incident)}
                          onShowQRCode={() => handleShowQRCode(incident)}
                        />
                      ))
                    )}
                  </div>
                  <ScrollBar orientation="vertical" />
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Video Player Modal */}
      <VideoPlayerModal
        incident={videoIncident}
        open={videoModalOpen}
        onClose={() => {
          setVideoModalOpen(false);
          setVideoIncident(null);
        }}
      />

      {/* QR Code Modal */}
      <QRCodeModal
        incident={qrIncident}
        open={qrModalOpen}
        onClose={() => {
          setQrModalOpen(false);
          setQrIncident(null);
        }}
      />
    </Layout>
  );
}
