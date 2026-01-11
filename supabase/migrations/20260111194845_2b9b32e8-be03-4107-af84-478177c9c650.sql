-- Create table for visual help images used in Battery Doctor, MedicalId, GuestWifi
CREATE TABLE public.visual_help_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_key TEXT NOT NULL,
  step_key TEXT NOT NULL,
  image_url TEXT,
  gif_url TEXT,
  video_url TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(feature_key, step_key)
);

-- Enable RLS
ALTER TABLE public.visual_help_images ENABLE ROW LEVEL SECURITY;

-- Everyone can read visual help images (public content)
CREATE POLICY "Anyone can view visual help images" 
ON public.visual_help_images 
FOR SELECT 
USING (true);

-- Only admins can modify visual help images
CREATE POLICY "Admins can manage visual help images" 
ON public.visual_help_images 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_visual_help_images_updated_at
BEFORE UPDATE ON public.visual_help_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default entries for Battery Doctor
INSERT INTO public.visual_help_images (feature_key, step_key, description) VALUES
('battery_doctor', 'brightness', 'Lysstyrke og Kontrolcenter'),
('battery_doctor', 'close-apps', 'App-switcher visning'),
('battery_doctor', 'old-phone', 'Batterisundhed indstillinger'),
('battery_doctor', 'background-refresh', 'Opdater i baggrunden indstillinger'),
('battery_doctor', 'location-services', 'Lokalitetstjenester indstillinger'),
('battery_doctor', 'low-power-mode', 'Strømbesparelse aktivering'),
('battery_doctor', 'notifications', 'Notifikationsindstillinger'),
-- MedicalId steps
('medical_id', 'step_1', 'Åbn appen Sundhed'),
('medical_id', 'step_2', 'Tryk på dit profilbillede'),
('medical_id', 'step_3', 'Vælg Nød-ID'),
('medical_id', 'step_4', 'Tryk på Rediger'),
('medical_id', 'step_5', 'Udfyld dine oplysninger'),
('medical_id', 'step_6', 'Tilføj en nødkontakt'),
('medical_id', 'step_7', 'Vis på låst skærm'),
-- GuestWifi steps
('guest_wifi', 'step_1', 'Lås din egen telefon op'),
('guest_wifi', 'step_2', 'Bed din gæst vælge netværket'),
('guest_wifi', 'step_3', 'Vent på pop-up beskeden'),
('guest_wifi', 'step_4', 'Tryk på Del adgangskode');