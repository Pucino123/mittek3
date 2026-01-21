-- Add help_video column to checkin_questions
ALTER TABLE public.checkin_questions 
ADD COLUMN IF NOT EXISTS help_video TEXT DEFAULT NULL;