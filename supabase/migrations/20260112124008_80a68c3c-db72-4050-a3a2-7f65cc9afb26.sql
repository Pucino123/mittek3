-- Add slug column to guides table for URL-friendly routing
ALTER TABLE public.guides 
ADD COLUMN slug text UNIQUE;

-- Create index for faster slug lookups
CREATE INDEX idx_guides_slug ON public.guides(slug);

-- Update existing guides with slug derived from title (temporary - will be overwritten by sync)
UPDATE public.guides 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(title, '[^a-zA-Z0-9æøåÆØÅ\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;