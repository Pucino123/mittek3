-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the sync-stripe-customers function to run daily at 3:00 AM (UTC)
-- Note: This creates a cron job that will call the edge function
SELECT cron.schedule(
  'nightly-stripe-sync',           -- job name
  '0 3 * * *',                     -- cron expression: every day at 3:00 AM UTC
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/scheduled-stripe-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);