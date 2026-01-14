-- Create table to store encrypted vault backup for legacy access
-- When owner sends Digital Arv code, we store an encrypted snapshot of vault items
CREATE TABLE public.legacy_vault_backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_data TEXT NOT NULL,
  iv TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.legacy_vault_backups ENABLE ROW LEVEL SECURITY;

-- Only the owner can manage their backup
CREATE POLICY "Users can manage their own legacy backup"
ON public.legacy_vault_backups
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trusted helpers with vault permission can read the backup
CREATE POLICY "Trusted helpers with vault permission can read backup"
ON public.legacy_vault_backups
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.trusted_helpers th
    WHERE th.helper_user_id = auth.uid()
    AND th.user_id = legacy_vault_backups.user_id
    AND th.invitation_accepted = true
    AND th.can_view_vault = true
  )
);

-- Add updated_at trigger
CREATE TRIGGER update_legacy_vault_backups_updated_at
BEFORE UPDATE ON public.legacy_vault_backups
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();