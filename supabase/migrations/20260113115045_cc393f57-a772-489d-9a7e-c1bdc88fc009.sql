-- Drop and recreate the accept_invite_token function with better email validation
CREATE OR REPLACE FUNCTION public.accept_invite_token(token_input text)
RETURNS TABLE(id uuid, user_id uuid, helper_user_id uuid, invitation_accepted boolean, success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
  v_user_email text;
BEGIN
  -- Get the current user's email from auth.users table (more reliable than JWT claims)
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE auth.users.id = auth.uid();
  
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
    invitation_token = NULL
  WHERE trusted_helpers.id = v_invitation.id;
  
  -- Return success
  RETURN QUERY SELECT 
    v_invitation.id, v_invitation.user_id, auth.uid(), 
    true, true, 'Invitation accepteret'::text;
END;
$$;