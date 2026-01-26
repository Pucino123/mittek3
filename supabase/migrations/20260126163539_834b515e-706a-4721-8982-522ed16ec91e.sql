-- Allow users to update their own bookings for peer_id columns (needed for remote support handshake)
-- Current policy only allows updates when status='pending', but users need to save user_peer_id during the session

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can update their own pending bookings" ON public.support_bookings;

-- Create new policy that allows users to update peer_id and status on their own bookings
CREATE POLICY "Users can update their own bookings for session"
  ON public.support_bookings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);