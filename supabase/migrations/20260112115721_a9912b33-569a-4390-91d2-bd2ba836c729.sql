-- Add can_view_vault permission column to trusted_helpers for vault sharing
ALTER TABLE public.trusted_helpers 
ADD COLUMN IF NOT EXISTS can_view_vault boolean DEFAULT false;

-- Create rate_limits table for edge function protection
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL, -- IP address or user ID
  endpoint text NOT NULL, -- Function name
  request_count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup 
ON public.rate_limits (identifier, endpoint, window_start);

-- Enable RLS on rate_limits - only service role can access
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No public policies - only service_role can read/write
-- This is intentional for security

-- Auto-cleanup old rate limit records (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE window_start < now() - interval '1 hour';
  RETURN NEW;
END;
$$;

-- Trigger to clean up on new inserts
DROP TRIGGER IF EXISTS trigger_cleanup_rate_limits ON public.rate_limits;
CREATE TRIGGER trigger_cleanup_rate_limits
AFTER INSERT ON public.rate_limits
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_old_rate_limits();