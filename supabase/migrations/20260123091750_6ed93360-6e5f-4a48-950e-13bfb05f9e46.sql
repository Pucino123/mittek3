-- Add peer_id column to support_bookings table for WebRTC signaling
ALTER TABLE public.support_bookings 
ADD COLUMN IF NOT EXISTS user_peer_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS admin_peer_id text DEFAULT NULL;