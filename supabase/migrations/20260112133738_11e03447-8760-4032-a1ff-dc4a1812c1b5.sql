-- Fix pending_subscriptions policy to be more secure
DROP POLICY IF EXISTS "Users can view own pending subscriptions securely" ON public.pending_subscriptions;

CREATE POLICY "Users can view claimed subscriptions only" 
ON public.pending_subscriptions 
FOR SELECT 
USING (
  (claimed = true AND claimed_by = auth.uid())
  OR is_admin(auth.uid())
);

-- Ensure profiles requires authentication
DROP POLICY IF EXISTS "deny_public_access" ON public.profiles;
CREATE POLICY "Require authentication for profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND (auth.uid() = user_id OR is_admin(auth.uid())));

-- Drop the old select policies that are now redundant
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Ensure subscriptions requires authentication  
CREATE POLICY "Require authentication for subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND (auth.uid() = user_id OR is_admin(auth.uid())));

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;

-- Protect audit_logs from tampering - only service role can insert
-- First ensure RLS is enabled
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Prevent any updates to audit logs
CREATE POLICY "Prevent audit log updates" 
ON public.audit_logs 
FOR UPDATE 
USING (false);

-- Prevent deletion of audit logs (only cleanup function can delete via security definer)
CREATE POLICY "Prevent audit log deletes" 
ON public.audit_logs 
FOR DELETE 
USING (false);