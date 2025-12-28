import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VideoUploadState {
  file: File | null;
  preview: string | null;
  uploading: boolean;
  progress: number;
  error: string | null;
  url: string | null;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

export function useVideoUpload() {
  const [state, setState] = useState<VideoUploadState>({
    file: null,
    preview: null,
    uploading: false,
    progress: 0,
    error: null,
    url: null,
  });
  
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Please upload an MP4, MOV, or WebM video file";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "Video file must be less than 50MB";
    }
    return null;
  };

  const selectFile = useCallback((file: File | null) => {
    if (!file) {
      setState({
        file: null,
        preview: null,
        uploading: false,
        progress: 0,
        error: null,
        url: null,
      });
      return;
    }

    const error = validateFile(file);
    if (error) {
      setState((prev) => ({ ...prev, error }));
      return;
    }

    // Create preview URL
    const preview = URL.createObjectURL(file);
    setState({
      file,
      preview,
      uploading: false,
      progress: 0,
      error: null,
      url: null,
    });
  }, []);

  const uploadVideo = useCallback(async (userId: string): Promise<string | null> => {
    if (!state.file) return null;

    setState((prev) => ({ ...prev, uploading: true, progress: 0, error: null }));

    try {
      const fileExt = state.file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("incident-videos")
        .upload(filePath, state.file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("incident-videos")
        .getPublicUrl(filePath);

      const videoUrl = urlData.publicUrl;

      setState((prev) => ({
        ...prev,
        uploading: false,
        progress: 100,
        url: videoUrl,
      }));

      return videoUrl;
    } catch (error) {
      console.error("Video upload error:", error);
      setState((prev) => ({
        ...prev,
        uploading: false,
        error: error instanceof Error ? error.message : "Failed to upload video",
      }));
      return null;
    }
  }, [state.file]);

  const clearVideo = useCallback(() => {
    if (state.preview) {
      URL.revokeObjectURL(state.preview);
    }
    setState({
      file: null,
      preview: null,
      uploading: false,
      progress: 0,
      error: null,
      url: null,
    });
  }, [state.preview]);

  return {
    ...state,
    videoRef,
    selectFile,
    uploadVideo,
    clearVideo,
  };
}
