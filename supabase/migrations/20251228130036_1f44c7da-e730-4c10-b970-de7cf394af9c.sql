-- Create responder_locations table for real-time tracking
CREATE TABLE public.responder_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL,
  responder_name TEXT NOT NULL,
  department TEXT NOT NULL,
  gps_lat DOUBLE PRECISION NOT NULL,
  gps_lng DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.responder_locations ENABLE ROW LEVEL SECURITY;

-- Responders (admins) can insert/update their own location
CREATE POLICY "Admins can insert their location"
ON public.responder_locations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can update their own location"
ON public.responder_locations
FOR UPDATE
USING (responder_id = auth.uid());

-- Users can view responder locations for their own incidents
CREATE POLICY "Users can view responders for their incidents"
ON public.responder_locations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.incidents
    WHERE incidents.id = responder_locations.incident_id
    AND incidents.reporter_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Admins can delete their own location entries
CREATE POLICY "Admins can delete their location"
ON public.responder_locations
FOR DELETE
USING (responder_id = auth.uid());

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.responder_locations;

-- Create index for faster queries
CREATE INDEX idx_responder_locations_incident ON public.responder_locations(incident_id);
CREATE INDEX idx_responder_locations_responder ON public.responder_locations(responder_id);