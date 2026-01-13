-- Create a SECURITY DEFINER RPC to verify invitation tokens for anonymous users
CREATE OR REPLACE FUNCTION public.verify_invite_token(token_input text)
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
  inviter_display_name text
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
    p.display_name as inviter_display_name
  FROM public.trusted_helpers th
  LEFT JOIN public.profiles p ON p.user_id = th.user_id
  WHERE th.invitation_token = token_input
  LIMIT 1;
$$;

-- Backwards compatible alias (older builds may call this)
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(p_token text)
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
  inviter_display_name text
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