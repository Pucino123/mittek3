-- Create system_content table for dynamic app texts
CREATE TABLE public.system_content (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_content ENABLE ROW LEVEL SECURITY;

-- Anyone can read system content
CREATE POLICY "Anyone can read system content"
  ON public.system_content
  FOR SELECT
  USING (true);

-- Only admins can manage system content
CREATE POLICY "Admins can manage system content"
  ON public.system_content
  FOR ALL
  USING (is_admin(auth.uid()));

-- Insert default values for Screenshot AI
INSERT INTO public.system_content (key, value, description) VALUES
  ('screenshot_ai_title', 'Screenshot → AI', 'Title for the Screenshot AI tool'),
  ('screenshot_ai_description', 'Upload et screenshot, og få det forklaret i simple ord', 'Description for the Screenshot AI tool'),
  ('screenshot_ai_prompt', 'Forklar hvad der sker på dette billede på en enkel og venlig måde, som en ældre person kan forstå. Brug korte sætninger og undgå tekniske termer.', 'AI prompt used for screenshot analysis');

-- Trigger for updated_at
CREATE TRIGGER update_system_content_updated_at
  BEFORE UPDATE ON public.system_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();