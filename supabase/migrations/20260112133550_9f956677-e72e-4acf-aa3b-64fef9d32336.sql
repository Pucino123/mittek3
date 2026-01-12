-- Drop the vulnerable email-based policy on pending_subscriptions
DROP POLICY IF EXISTS "Users can view own pending subscriptions" ON public.pending_subscriptions;

-- Create a more secure policy that uses user_id from auth instead of email matching
-- This prevents email enumeration attacks
CREATE POLICY "Users can view own pending subscriptions securely" 
ON public.pending_subscriptions 
FOR SELECT 
USING (
  -- Only allow if already claimed by this user
  (claimed_by = auth.uid())
  OR
  -- Or if admin
  is_admin(auth.uid())
);

-- Add a separate policy for claiming (checking email match only during claim process via edge function)
-- The edge function uses service role so this is secure

-- Create a function to check pending subscription by email (only callable by service role)
CREATE OR REPLACE FUNCTION public.check_pending_subscription_by_email(check_email text)
RETURNS TABLE(
  id uuid,
  checkout_session_id text,
  plan_tier plan_tier,
  claimed boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return minimal info needed for claiming
  RETURN QUERY
  SELECT 
    ps.id,
    ps.checkout_session_id,
    ps.plan_tier,
    ps.claimed
  FROM pending_subscriptions ps
  WHERE lower(ps.purchaser_email) = lower(check_email)
  AND ps.claimed = false
  LIMIT 1;
END;
$$;

-- Revoke direct access to function from anon/authenticated
REVOKE ALL ON FUNCTION public.check_pending_subscription_by_email(text) FROM anon, authenticated;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pending_subscriptions_email_lower 
ON public.pending_subscriptions (lower(purchaser_email)) 
WHERE claimed = false;