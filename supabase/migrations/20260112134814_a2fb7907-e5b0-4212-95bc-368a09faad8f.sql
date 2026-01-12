-- First, let's make the is_admin function more secure by ensuring it can't be exploited
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND is_admin = true
      AND _user_id IS NOT NULL
  )
$$;

-- Drop all existing SELECT policies on profiles to recreate them more securely
DROP POLICY IF EXISTS "Require authentication for profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create strict policy: Users can ONLY see their own profile
CREATE POLICY "Users can only view own profile" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- Separate admin policy with explicit checks
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.is_admin = true
  )
);

-- Also fix trusted_helpers to prevent email enumeration
DROP POLICY IF EXISTS "Users can view own helpers" ON public.trusted_helpers;

-- More restrictive policy for trusted_helpers
CREATE POLICY "Users can view own helpers strictly" 
ON public.trusted_helpers 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL
  AND (
    auth.uid() = user_id 
    OR (auth.uid() = helper_user_id AND invitation_accepted = true)
  )
);

-- Ensure invitation tokens are not exposed in SELECT
-- Create a view that hides sensitive fields for helpers
CREATE OR REPLACE VIEW public.trusted_helpers_safe AS
SELECT 
  id,
  user_id,
  helper_user_id,
  helper_email,
  invitation_accepted,
  can_view_dashboard,
  can_view_checkins,
  can_view_tickets,
  can_view_notes,
  can_view_vault,
  medical_id_verified,
  medical_id_verified_at,
  created_at,
  -- Only show token to the owner
  CASE WHEN auth.uid() = user_id THEN invitation_token ELSE NULL END as invitation_token
FROM public.trusted_helpers
WHERE auth.uid() = user_id OR (auth.uid() = helper_user_id AND invitation_accepted = true);