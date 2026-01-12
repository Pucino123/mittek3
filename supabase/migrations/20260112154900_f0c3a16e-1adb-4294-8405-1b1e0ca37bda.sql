-- Add RLS policies to rate_limits table
-- This table is used internally by edge functions for rate limiting
-- It should only be accessible by service role, not by regular users

-- Policy: Deny all direct access from authenticated users (service role bypasses RLS)
CREATE POLICY "Deny direct user access to rate_limits"
ON public.rate_limits
FOR ALL
TO authenticated
USING (false);

-- Policy: Allow anon to check rate limits (read-only for edge functions)
CREATE POLICY "Allow rate limit checks"
ON public.rate_limits
FOR SELECT
TO anon
USING (true);