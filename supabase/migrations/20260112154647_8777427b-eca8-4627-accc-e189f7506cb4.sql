-- Move pg_cron extension from public to cron schema for security
-- First drop the scheduled job, then the extension, and recreate in proper schema
SELECT cron.unschedule('nightly-stripe-sync');

-- Drop and recreate in cron schema
DROP EXTENSION pg_cron;

-- Recreate in cron schema (this is the recommended approach)
CREATE EXTENSION pg_cron WITH SCHEMA cron;

-- Re-schedule the sync job
SELECT cron.schedule(
  'nightly-stripe-sync',
  '0 3 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://asldvlulkqbjjxqabzbv.supabase.co/functions/v1/scheduled-stripe-sync',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);