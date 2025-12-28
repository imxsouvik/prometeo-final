import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  MapPin,
  Video,
  FileText,
  Bell,
  Loader2,
  CheckCircle,
  X,
  Upload,
  Navigation,
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useVideoUpload } from "@/hooks/useVideoUpload";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const countWords = (text: string): number => {
  return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
};

const reportSchema = z.object({
  reportType: z.enum(["medical", "fire", "crime", "accident", "other"], {
    required_error: "Please select a report type",
  }),
  description: z.string().optional(),
  notifyHospital: z.boolean().default(false),
  notifyFireStation: z.boolean().default(false),
  notifyPolice: z.boolean().default(false),
}).refine(
  (data) => data.notifyHospital || data.notifyFireStation || data.notifyPolice,
  {
    message: "Please select at least one department to notify",
    path: ["notifyHospital"],
  }
);

type ReportFormData = z.infer<typeof reportSchema>;

const reportTypes = [
  { value: "medical", label: "Medical", icon: "🏥", color: "bg-red-500" },
  { value: "fire", label: "Fire", icon: "🔥", color: "bg-orange-500" },
  { value: "crime", label: "Crime", icon: "🚨", color: "bg-purple-500" },
  { value: "accident", label: "Accident", icon: "🚗", color: "bg-yellow-500" },
  { value: "other", label: "Other", icon: "❓", color: "bg-gray-500" },
] as const;

export default function Report() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { toast } = useToast();
  const geolocation = useGeolocation();
  const videoUpload = useVideoUpload();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reportType: undefined,
      description: "",
      notifyHospital: false,
      notifyFireStation: false,
      notifyPolice: false,
    },
  });

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/register?redirect=/report");
    }
  }, [user, authLoading, navigate]);

  // Request location on mount
  useEffect(() => {
    if (user && !geolocation.latitude && !geolocation.loading && !geolocation.error) {
      geolocation.requestLocation();
    }
  }, [user]);

  const description = form.watch("description");
  useEffect(() => {
    setWordCount(countWords(description || ""));
  }, [description]);

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      videoUpload.selectFile(file);
    }
  };

  const isFormValid = () => {
    const values = form.getValues();
    const hasReportType = !!values.reportType;
    const hasNotification = values.notifyHospital || values.notifyFireStation || values.notifyPolice;
    const hasVideo = !!videoUpload.file;
    const hasLocation = !!geolocation.latitude && !!geolocation.longitude;
    
    return hasReportType && hasNotification && hasVideo && hasLocation;
  };

  const onSubmit = async (data: ReportFormData) => {
    if (!user || !profile) {
      toast({
        title: "Error",
        description: "You must be logged in to submit a report",
        variant: "destructive",
      });
      return;
    }

    if (!geolocation.latitude || !geolocation.longitude) {
      toast({
        title: "Location required",
        description: "Please enable location access to submit a report",
        variant: "destructive",
      });
      return;
    }

    if (!videoUpload.file) {
      toast({
        title: "Video required",
        description: "Please upload a video of the incident",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload video first
      const videoUrl = await videoUpload.uploadVideo(user.id);
      if (!videoUrl) {
        throw new Error("Failed to upload video");
      }

      // Create incident record
      const { error: insertError } = await supabase.from("incidents").insert({
        reporter_id: user.id,
        reporter_name: profile.name,
        reporter_phone: profile.phone,
        gps_lat: geolocation.latitude,
        gps_lng: geolocation.longitude,
        gps_address: geolocation.address,
        report_type: data.reportType,
        video_url: videoUrl,
        description: data.description,
        notify_hospital: data.notifyHospital,
        notify_fire_station: data.notifyFireStation,
        notify_police: data.notifyPolice,
        status: "pending",
      });

      if (insertError) throw insertError;

      setSubmitted(true);
      toast({
        title: "Report submitted",
        description: "Emergency services have been notified. Help is on the way.",
      });

      // Reset form after short delay
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (error) {
      console.error("Report submission error:", error);
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Failed to submit report",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  if (submitted) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center animate-slide-in">
            <CardContent className="pt-8 pb-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <h2 className="font-display text-2xl font-bold mb-2 text-card-foreground">Report Submitted</h2>
              <p className="text-muted-foreground mb-4">
                Emergency services have been notified. Stay calm and stay safe.
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecting to home...
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="animate-slide-in">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto p-3 rounded-xl bg-destructive/10 w-fit">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="font-display text-2xl">Report an Emergency</CardTitle>
            <CardDescription>
              Fill in all required fields to submit your emergency report
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Auto-populated User Info */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Your Name</Label>
                  <Input
                    value={profile?.name || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={profile?.phone || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              {/* GPS Location */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location *
                </Label>
                
                {geolocation.loading ? (
                  <Alert>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertDescription>Getting your location...</AlertDescription>
                  </Alert>
                ) : geolocation.error ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>{geolocation.error}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={geolocation.requestLocation}
                      >
                        Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : geolocation.latitude && geolocation.longitude ? (
                  <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                    <div className="flex items-start gap-3">
                      <Navigation className="h-5 w-5 text-success mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-success">Location captured</p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {geolocation.address || `${geolocation.latitude.toFixed(6)}, ${geolocation.longitude.toFixed(6)}`}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={geolocation.requestLocation}
                        className="shrink-0"
                      >
                        Update
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={geolocation.requestLocation}
                    className="w-full"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Enable Location Access
                  </Button>
                )}
              </div>

              {/* Report Type */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Report Type *
                </Label>
                <RadioGroup
                  value={form.watch("reportType")}
                  onValueChange={(value) => form.setValue("reportType", value as any, { shouldValidate: true })}
                  className="grid grid-cols-2 sm:grid-cols-5 gap-2"
                >
                  {reportTypes.map((type) => (
                    <div key={type.value}>
                      <RadioGroupItem value={type.value} id={type.value} className="peer sr-only" />
                      <Label
                        htmlFor={type.value}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all hover:bg-muted",
                          form.watch("reportType") === type.value
                            ? "border-primary bg-primary/5"
                            : "border-muted"
                        )}
                      >
                        <span className="text-xl mb-1">{type.icon}</span>
                        <span className="text-xs font-medium">{type.label}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {form.formState.errors.reportType && (
                  <p className="text-sm text-destructive">{form.formState.errors.reportType.message}</p>
                )}
              </div>

              {/* Video Upload */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Video Evidence * <span className="text-xs text-muted-foreground">(max 50MB)</span>
                </Label>
                
                {videoUpload.preview ? (
                  <div className="relative rounded-lg overflow-hidden bg-muted">
                    <video
                      src={videoUpload.preview}
                      controls
                      className="w-full max-h-48 object-contain"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={videoUpload.clearVideo}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    {videoUpload.uploading && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      id="video"
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm"
                      onChange={handleVideoSelect}
                      className="hidden"
                    />
                    <label htmlFor="video" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Upload video (MP4, MOV, or WebM)
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Click to browse or drag and drop
                      </p>
                    </label>
                  </div>
                )}
                {videoUpload.error && (
                  <p className="text-sm text-destructive">{videoUpload.error}</p>
                )}
              </div>

              {/* Notify Departments */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notify Departments *
                </Label>
                <div className="grid sm:grid-cols-3 gap-3">
                  <label
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                      form.watch("notifyHospital")
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/30"
                    )}
                  >
                    <Checkbox
                      checked={form.watch("notifyHospital")}
                      onCheckedChange={(checked) =>
                        form.setValue("notifyHospital", !!checked, { shouldValidate: true })
                      }
                    />
                    <div>
                      <span className="text-lg">🏥</span>
                      <span className="ml-2 text-sm font-medium">Hospital</span>
                    </div>
                  </label>
                  <label
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                      form.watch("notifyFireStation")
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/30"
                    )}
                  >
                    <Checkbox
                      checked={form.watch("notifyFireStation")}
                      onCheckedChange={(checked) =>
                        form.setValue("notifyFireStation", !!checked, { shouldValidate: true })
                      }
                    />
                    <div>
                      <span className="text-lg">🚒</span>
                      <span className="ml-2 text-sm font-medium">Fire Station</span>
                    </div>
                  </label>
                  <label
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                      form.watch("notifyPolice")
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/30"
                    )}
                  >
                    <Checkbox
                      checked={form.watch("notifyPolice")}
                      onCheckedChange={(checked) =>
                        form.setValue("notifyPolice", !!checked, { shouldValidate: true })
                      }
                    />
                    <div>
                      <span className="text-lg">🚔</span>
                      <span className="ml-2 text-sm font-medium">Police</span>
                    </div>
                  </label>
                </div>
                {form.formState.errors.notifyHospital && (
                  <p className="text-sm text-destructive">{form.formState.errors.notifyHospital.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Description <span className="text-muted-foreground text-xs">(Optional)</span>
                  </Label>
                </div>
                <Textarea
                  placeholder="Describe the emergency situation in detail. Include what happened, who is involved, and any immediate dangers..."
                  rows={6}
                  {...form.register("description")}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full shadow-glow"
                disabled={isSubmitting || !isFormValid()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting Report...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Submit Emergency Report
                  </>
                )}
              </Button>

              {!isFormValid() && (
                <p className="text-xs text-center text-muted-foreground">
                  Complete all required fields to submit your report
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
