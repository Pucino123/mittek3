-- Create table for admin-managed checkin questions
CREATE TABLE public.checkin_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_type TEXT NOT NULL, -- 'iphone', 'ipad', 'mac'
  question_id TEXT NOT NULL, -- unique identifier like 'iphone_update'
  text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'boolean', -- 'boolean' or 'done'
  weight INTEGER NOT NULL DEFAULT 10,
  good_answer BOOLEAN NOT NULL DEFAULT true,
  recommendation TEXT NOT NULL,
  check_label TEXT NOT NULL,
  help_title TEXT,
  help_screenshot TEXT,
  help_steps JSONB DEFAULT '[]'::jsonb, -- Array of step objects
  help_tip TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(device_type, question_id)
);

-- Enable RLS
ALTER TABLE public.checkin_questions ENABLE ROW LEVEL SECURITY;

-- Anyone can read active questions
CREATE POLICY "Anyone can view active checkin questions" 
ON public.checkin_questions 
FOR SELECT 
USING (is_active = true);

-- Admins can manage all questions
CREATE POLICY "Admins can manage checkin questions" 
ON public.checkin_questions 
FOR ALL 
USING (is_admin(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_checkin_questions_device ON public.checkin_questions(device_type, sort_order);

-- Add trigger for updated_at
CREATE TRIGGER update_checkin_questions_updated_at
BEFORE UPDATE ON public.checkin_questions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();