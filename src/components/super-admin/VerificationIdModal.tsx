import { Download, ZoomIn, ZoomOut, RotateCw, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AdminAccount } from "@/hooks/useAdminAccounts";
import { supabase } from "@/integrations/supabase/client";

const departmentLabels: Record<AdminAccount["department"], string> = {
  hospital: "Hospital",
  fire_station: "Fire Station",
  police: "Police",
};

interface VerificationIdModalProps {
  account: AdminAccount | null;
  open: boolean;
  onClose: () => void;
}

export function VerificationIdModal({ account, open, onClose }: VerificationIdModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract file path from the stored URL
  const getFilePath = (url: string): string | null => {
    try {
      // The URL format is: https://<project>.supabase.co/storage/v1/object/public/verification-ids/<path>
      const match = url.match(/verification-ids\/(.+)$/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const fetchSignedUrl = async () => {
      if (!account || !open) return;
      
      setLoading(true);
      setError(null);
      
      const filePath = getFilePath(account.verification_id_url);
      if (!filePath) {
        setError("Invalid file path");
        setLoading(false);
        return;
      }

      const { data, error: signError } = await supabase.storage
        .from("verification-ids")
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (signError) {
        console.error("Error creating signed URL:", signError);
        setError("Failed to load verification ID");
        setLoading(false);
        return;
      }

      setSignedUrl(data.signedUrl);
      setLoading(false);
    };

    fetchSignedUrl();
  }, [account, open]);

  if (!account) return null;

  const isPdf = account.verification_id_url.toLowerCase().endsWith(".pdf");

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleDownload = () => {
    if (signedUrl) {
      window.open(signedUrl, "_blank");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          setZoom(1);
          setRotation(0);
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Verification ID - {account.name}
            <Badge variant="secondary">{departmentLabels[account.department]}</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleZoomOut} disabled={isPdf}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground w-16 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button size="sm" variant="outline" onClick={handleZoomIn} disabled={isPdf}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleRotate} disabled={isPdf}>
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
          <Button size="sm" variant="outline" onClick={handleDownload} disabled={!signedUrl}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-muted/50 rounded-lg p-4 min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-destructive">{error}</p>
            </div>
          ) : signedUrl ? (
            isPdf ? (
              <iframe
                src={signedUrl}
                className="w-full h-full min-h-[500px] rounded border"
                title="Verification ID PDF"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <img
                  src={signedUrl}
                  alt={`Verification ID for ${account.name}`}
                  className="max-w-full max-h-full object-contain transition-transform duration-200"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  }}
                />
              </div>
            )
          ) : null}
        </div>

        {/* Account Info */}
        <div className="border-t pt-3 grid sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Email:</span>{" "}
            <span className="font-medium">{account.email}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Phone:</span>{" "}
            <span className="font-medium">{account.phone}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Status:</span>{" "}
            <span className="font-medium capitalize">{account.status}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
