
-- Restrict therapy_routes to authenticated users only
DROP POLICY IF EXISTS "Anyone can view active therapy routes" ON public.therapy_routes;
CREATE POLICY "Authenticated users can view therapy routes"
  ON public.therapy_routes FOR SELECT
  TO authenticated
  USING (true);

-- Restrict therapy_modules to authenticated users only
DROP POLICY IF EXISTS "Anyone can view active therapy modules" ON public.therapy_modules;
CREATE POLICY "Authenticated users can view therapy modules"
  ON public.therapy_modules FOR SELECT
  TO authenticated
  USING (true);

-- Restrict therapy_videos metadata to authenticated users only
DROP POLICY IF EXISTS "Anyone can view therapy videos metadata" ON public.therapy_videos;
CREATE POLICY "Authenticated users can view therapy videos metadata"
  ON public.therapy_videos FOR SELECT
  TO authenticated
  USING (true);

-- Make therapy-videos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'therapy-videos';

-- Update storage policy to require authentication
DROP POLICY IF EXISTS "Anyone can view therapy videos" ON storage.objects;
CREATE POLICY "Authenticated users can view therapy videos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'therapy-videos');
