-- Enable realtime for support_bookings table so peer ID changes are broadcast
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_bookings;