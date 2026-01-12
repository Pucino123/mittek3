-- Tilføj icon kolonne til guides tabellen
ALTER TABLE public.guides ADD COLUMN IF NOT EXISTS icon text;