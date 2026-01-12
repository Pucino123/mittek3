-- Fix: Replace overly permissive INSERT policy with service-role only approach
-- Drop the permissive policy
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.audit_logs;

-- Audit logs should only be insertable via service role (edge functions)
-- No user-facing INSERT policy needed since service role bypasses RLS