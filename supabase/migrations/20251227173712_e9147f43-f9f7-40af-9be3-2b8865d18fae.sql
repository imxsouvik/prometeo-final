-- Create enum for report types
CREATE TYPE public.report_type AS ENUM ('medical', 'fire', 'crime', 'accident', 'other');

-- Create enum for incident status
CREATE TYPE public.incident_status AS ENUM ('pending', 'seen', 'responding', 'resolved');

-- Create incidents table
CREATE TABLE public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reporter_name TEXT NOT NULL,
  reporter_phone TEXT NOT NULL,
  gps_lat DOUBLE PRECISION NOT NULL,
  gps_lng DOUBLE PRECISION NOT NULL,
  gps_address TEXT,
  report_type report_type NOT NULL,
  video_url TEXT NOT NULL,
  video_thumbnail_url TEXT,
  description TEXT NOT NULL,
  notify_hospital BOOLEAN DEFAULT false NOT NULL,
  notify_fire_station BOOLEAN DEFAULT false NOT NULL,
  notify_police BOOLEAN DEFAULT false NOT NULL,
  status incident_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create incident status logs for tracking history
CREATE TABLE public.incident_status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES public.incidents(id) ON DELETE CASCADE NOT NULL,
  old_status incident_status,
  new_status incident_status NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_status_logs ENABLE ROW LEVEL SECURITY;

-- Enable realtime for incidents
ALTER TABLE public.incidents REPLICA IDENTITY FULL;

-- RLS Policies for incidents

-- Users can view their own incidents
CREATE POLICY "Users can view own incidents"
  ON public.incidents FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- Users can create incidents
CREATE POLICY "Users can create incidents"
  ON public.incidents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Admins can view incidents for their department
CREATE POLICY "Admins can view department incidents"
  ON public.incidents FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') AND (
      (notify_hospital = true AND EXISTS (
        SELECT 1 FROM public.admin_profiles 
        WHERE user_id = auth.uid() AND department = 'hospital' AND status = 'approved'
      )) OR
      (notify_fire_station = true AND EXISTS (
        SELECT 1 FROM public.admin_profiles 
        WHERE user_id = auth.uid() AND department = 'fire_station' AND status = 'approved'
      )) OR
      (notify_police = true AND EXISTS (
        SELECT 1 FROM public.admin_profiles 
        WHERE user_id = auth.uid() AND department = 'police' AND status = 'approved'
      ))
    )
  );

-- Super admins can view all incidents
CREATE POLICY "Super admins can view all incidents"
  ON public.incidents FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Admins can update incident status
CREATE POLICY "Admins can update incidents"
  ON public.incidents FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
  );

-- RLS Policies for incident_status_logs

-- Users can view logs for their incidents
CREATE POLICY "Users can view own incident logs"
  ON public.incident_status_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.incidents 
      WHERE incidents.id = incident_status_logs.incident_id 
      AND incidents.reporter_id = auth.uid()
    )
  );

-- Admins can view and create logs
CREATE POLICY "Admins can view incident logs"
  ON public.incident_status_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can create incident logs"
  ON public.incident_status_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Trigger for updated_at on incidents
CREATE TRIGGER set_incidents_updated_at
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create storage bucket for incident videos
INSERT INTO storage.buckets (id, name, public, file_size_limit) 
VALUES ('incident-videos', 'incident-videos', true, 52428800);

-- Storage policies for incident videos
CREATE POLICY "Authenticated users can upload incident videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'incident-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view incident videos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'incident-videos');

CREATE POLICY "Users can delete own incident videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'incident-videos' AND auth.uid()::text = (storage.foldername(name))[1]);