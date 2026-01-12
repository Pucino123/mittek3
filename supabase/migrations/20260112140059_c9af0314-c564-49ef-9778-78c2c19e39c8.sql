-- Enable realtime for profiles table to allow automatic updates when admin status changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;