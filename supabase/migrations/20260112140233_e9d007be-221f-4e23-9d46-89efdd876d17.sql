-- Enable realtime for subscriptions table to allow automatic updates when plan changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;