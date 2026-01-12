-- Fix infinite recursion in profiles RLS policy by using security definer function
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Harden rate_limits access: deny all direct reads/writes (edge functions use service role and bypass RLS)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow rate limit checks" ON public.rate_limits;
DROP POLICY IF EXISTS "Deny direct user access to rate_limits" ON public.rate_limits;

CREATE POLICY "Deny all access to rate_limits"
ON public.rate_limits
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);