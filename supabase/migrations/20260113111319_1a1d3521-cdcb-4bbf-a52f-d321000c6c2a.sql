-- Create a security definer function to get invitation by token
-- This allows unauthenticated users to verify their invitation token
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
  WHERE th.invitation_token = p_token
    AND th.invitation_accepted = false
  LIMIT 1;
$$;