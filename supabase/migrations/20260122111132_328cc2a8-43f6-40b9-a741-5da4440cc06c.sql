-- Add cover_image_url and is_paginated columns to guides table
ALTER TABLE public.guides 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS is_paginated BOOLEAN DEFAULT false;