ALTER TABLE public.user_dashboard_settings
ADD COLUMN IF NOT EXISTS card_categories jsonb NOT NULL DEFAULT '{}'::jsonb;