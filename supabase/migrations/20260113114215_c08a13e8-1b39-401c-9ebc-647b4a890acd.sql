-- Add expires_at column to trusted_helpers table
ALTER TABLE public.trusted_helpers 
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone DEFAULT NULL;

-- Drop existing functions first to change return type
DROP FUNCTION IF EXISTS public.verify_invite_token(text);
DROP FUNCTION IF EXISTS public.get_invitation_by_token(text);

-- Recreate verify_invite_token with expires_at in return type
CREATE FUNCTION public.verify_invite_token(token_input text)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  helper_email text,
  invitation_accepted boolean,
  can_view_dashboard boolean,
  can_view_checkins boolean,
  can_view_tickets boolean,
  can_view_notes boolean,
  can_view_vault boolean,
  inviter_display_name text,
  expires_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    th.id,
    th.user_id,
    th.helper_email,
    th.invitation_accepted,
    th.can_view_dashboard,
    th.can_view_checkins,
    th.can_view_tickets,
    th.can_view_notes,
    th.can_view_vault,
    p.display_name as inviter_display_name,
    th.expires_at
  FROM public.trusted_helpers th
  LEFT JOIN public.profiles p ON p.user_id = th.user_id
  WHERE th.invitation_token = token_input
    AND (th.expires_at IS NULL OR th.expires_at > now())
  LIMIT 1;
$$;

-- Recreate accept_invite_token with expiration check
CREATE OR REPLACE FUNCTION public.accept_invite_token(token_input text)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  helper_user_id uuid,
  invitation_accepted boolean,
  success boolean,
  message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
  v_user_email text;
BEGIN
  -- Get the current user's email from JWT
  v_user_email := auth.jwt() ->> 'email';
  
  -- Find the invitation
  SELECT th.* INTO v_invitation
  FROM public.trusted_helpers th
  WHERE th.invitation_token = token_input
  LIMIT 1;
  
  -- Check if invitation exists
  IF v_invitation IS NULL THEN
    RETURN QUERY SELECT 
      NULL::uuid, NULL::uuid, NULL::uuid, false, false, 
      'Invitation ikke fundet'::text;
    RETURN;
  END IF;
  
  -- Check if expired
  IF v_invitation.expires_at IS NOT NULL AND v_invitation.expires_at < now() THEN
    RETURN QUERY SELECT 
      v_invitation.id, v_invitation.user_id, NULL::uuid, 
      false, false, 'Invitationen er udløbet'::text;
    RETURN;
  END IF;
  
  -- Check if already accepted
  IF v_invitation.invitation_accepted = true THEN
    RETURN QUERY SELECT 
      v_invitation.id, v_invitation.user_id, v_invitation.helper_user_id, 
      true, false, 'Invitation er allerede accepteret'::text;
    RETURN;
  END IF;
  
  -- Validate email matches (case-insensitive)
  IF lower(v_invitation.helper_email) != lower(v_user_email) THEN
    RETURN QUERY SELECT 
      v_invitation.id, v_invitation.user_id, NULL::uuid, 
      false, false, 'Din email matcher ikke invitationen'::text;
    RETURN;
  END IF;
  
  -- Accept the invitation
  UPDATE public.trusted_helpers
  SET 
    helper_user_id = auth.uid(),
    invitation_accepted = true,
    invitation_token = NULL,
    updated_at = now()
  WHERE id = v_invitation.id;
  
  -- Return success
  RETURN QUERY SELECT 
    v_invitation.id, v_invitation.user_id, auth.uid(), 
    true, true, 'Invitation accepteret'::text;
END;
$$;

-- Recreate backwards compatible alias
CREATE FUNCTION public.get_invitation_by_token(p_token text)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  helper_email text,
  invitation_accepted boolean,
  can_view_dashboard boolean,
  can_view_checkins boolean,
  can_view_tickets boolean,
  can_view_notes boolean,
  can_view_vault boolean,
  inviter_display_name text,
  expires_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.verify_invite_token(p_token);
$$;

GRANT EXECUTE ON FUNCTION public.verify_invite_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invite_token(text) TO authenticated;