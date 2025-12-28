import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Incident } from "@/hooks/useIncidents";

interface QRCodeModalProps {
  incident: Incident | null;
  open: boolean;
  onClose: () => void;
}

export function QRCodeModal({ incident, open, onClose }: QRCodeModalProps) {
  if (!incident) return null;

  // Create Google Maps directions URL
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${incident.gps_lat},${incident.gps_lng}&travelmode=driving`;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm z-[1000]">
        <DialogHeader>
          <DialogTitle className="text-center">Navigate to Incident</DialogTitle>
          <DialogDescription className="text-center">
            Scan this QR code with your mobile device to open navigation
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <div className="bg-white p-4 rounded-lg shadow-inner">
            <QRCodeSVG
              value={mapsUrl}
              size={200}
              level="H"
              includeMargin
            />
          </div>

          <div className="text-center space-y-1">
            <p className="text-sm font-medium">
              {incident.report_type.charAt(0).toUpperCase() + incident.report_type.slice(1)} Emergency
            </p>
            <p className="text-xs text-muted-foreground">
              {incident.gps_address || `${incident.gps_lat.toFixed(6)}, ${incident.gps_lng.toFixed(6)}`}
            </p>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Opens Google Maps with directions from your current location
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
