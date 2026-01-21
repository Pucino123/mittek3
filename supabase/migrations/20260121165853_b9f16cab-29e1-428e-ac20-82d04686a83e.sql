-- Create storage bucket for checkin help assets (images and videos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('checkin-help-assets', 'checkin-help-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public can read checkin help assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'checkin-help-assets');

-- Allow admins to upload
CREATE POLICY "Admins can upload checkin help assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'checkin-help-assets' 
  AND public.is_admin(auth.uid())
);

-- Allow admins to update
CREATE POLICY "Admins can update checkin help assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'checkin-help-assets' 
  AND public.is_admin(auth.uid())
);

-- Allow admins to delete
CREATE POLICY "Admins can delete checkin help assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'checkin-help-assets' 
  AND public.is_admin(auth.uid())
);