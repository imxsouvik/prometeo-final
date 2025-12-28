import { useState } from "react";
import { X, Play, Pause, Maximize2, Volume2, VolumeX } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Incident } from "@/hooks/useIncidents";
import { cn } from "@/lib/utils";

interface VideoPlayerModalProps {
  incident: Incident | null;
  open: boolean;
  onClose: () => void;
}

export function VideoPlayerModal({ incident, open, onClose }: VideoPlayerModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  if (!incident) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden z-[1000]">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl">
              {incident.report_type === "medical" && "🏥"}
              {incident.report_type === "fire" && "🔥"}
              {incident.report_type === "crime" && "🚨"}
              {incident.report_type === "accident" && "🚗"}
              {incident.report_type === "other" && "❓"}
            </span>
            {incident.report_type.charAt(0).toUpperCase() + incident.report_type.slice(1)} Emergency
            - Video Evidence
          </DialogTitle>
        </DialogHeader>

        <div className="relative bg-black aspect-video">
          <video
            src={incident.video_url}
            controls
            autoPlay
            className="w-full h-full object-contain"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        </div>

        <div className="p-4 space-y-3 bg-muted/50">
          <div>
            <h4 className="font-semibold text-sm mb-1">Incident Description</h4>
            <p className="text-sm text-muted-foreground">{incident.description}</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Reporter:</span>{" "}
              <span className="font-medium">{incident.reporter_name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Phone:</span>{" "}
              <span className="font-medium">{incident.reporter_phone}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>{" "}
              <span className="font-medium capitalize">{incident.status}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
