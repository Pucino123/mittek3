-- Add legacy_access_code column to profiles table for storing the Digital Legacy access code
-- This code can be shared with trusted contacts to access the vault
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS legacy_access_code_hash TEXT,
ADD COLUMN IF NOT EXISTS legacy_access_code_sent_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_legacy_access_code ON public.profiles(legacy_access_code_hash) WHERE legacy_access_code_hash IS NOT NULL;