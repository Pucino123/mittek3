-- Drop the existing permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;

-- Create a new restrictive INSERT policy that only allows service_role
-- This ensures all page view inserts go through the edge function with rate limiting
CREATE POLICY "Only service role can insert page views" 
ON public.page_views 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');