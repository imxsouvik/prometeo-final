import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Loader2, MapPin, AlertCircle, Plus } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useUserIncidents, UserIncident } from "@/hooks/useUserIncidents";
import { UserReportCard } from "@/components/reports/UserReportCard";
import { UserReportMap } from "@/components/reports/UserReportMap";

export default function MyReports() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { incidents, loading: incidentsLoading, error } = useUserIncidents();
  const [selectedIncident, setSelectedIncident] = useState<UserIncident | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login?redirect=/my-reports");
    }
  }, [user, authLoading, navigate]);

  // Auto-select first incident or one that's responding
  useEffect(() => {
    if (incidents.length > 0 && !selectedIncident) {
      const respondingIncident = incidents.find((i) => i.status === "responding");
      setSelectedIncident(respondingIncident || incidents[0]);
    }
  }, [incidents, selectedIncident]);

  if (authLoading || incidentsLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen pt-20 pb-8">
        <div className="container mx-auto px-4">
          {/* Header Block */}
          <div className="bg-[#0E0E55] rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/10">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">My Reports</h1>
                  <p className="text-white/80">Track your submitted emergency reports</p>
                </div>
              </div>
              <Button onClick={() => navigate("/report")} className="bg-white text-[#0E0E55] hover:bg-white/90">
                <Plus className="h-4 w-4 mr-2" />
                New Report
              </Button>
            </div>
          </div>

          {error && (
            <Card className="mb-6 border-destructive">
              <CardContent className="flex items-center gap-2 py-4">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <span className="text-destructive">{error}</span>
              </CardContent>
            </Card>
          )}

          {incidents.length === 0 ? (
            <Card className="py-16">
              <CardContent className="flex flex-col items-center justify-center text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No Reports Yet</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  You haven't submitted any emergency reports. When you do, you'll be able to track their
                  status here.
                </p>
                <Button onClick={() => navigate("/report")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Submit a Report
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Reports List */}
              <div className="border-2 border-card rounded-lg p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                <div className="flex items-center gap-2 text-sm mb-4 p-3 rounded-lg bg-card text-card-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    {incidents.length} report{incidents.length !== 1 ? "s" : ""} •{" "}
                    {incidents.filter((i) => i.status === "responding").length} responding
                  </span>
                </div>
                <div className="space-y-4">
                  {incidents.map((incident) => (
                    <UserReportCard
                      key={incident.id}
                      incident={incident}
                      isSelected={selectedIncident?.id === incident.id}
                      onSelect={setSelectedIncident}
                    />
                  ))}
                </div>
              </div>

              {/* Map */}
              <div className="lg:sticky lg:top-24 h-[500px] lg:h-[calc(100vh-200px)]">
                <div className="h-full border-2 border-card rounded-lg overflow-hidden">
                  <div className="p-4 flex items-center gap-2 bg-[#0E0E55]">
                    <MapPin className="h-5 w-5 text-white" />
                    <span className="font-medium text-white">
                      {selectedIncident
                        ? `${selectedIncident.report_type.toUpperCase()} - ${selectedIncident.status}`
                        : "Select a report"}
                    </span>
                  </div>
                  <div className="h-[calc(100%-56px)] bg-background">
                    <UserReportMap incident={selectedIncident} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
