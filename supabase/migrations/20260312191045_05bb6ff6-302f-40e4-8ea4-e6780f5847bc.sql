-- 1) Add durable storage metadata columns to therapy_videos
ALTER TABLE public.therapy_videos
ADD COLUMN IF NOT EXISTS storage_bucket text,
ADD COLUMN IF NOT EXISTS storage_path text;

-- 2) Backfill existing rows from current video_url values
UPDATE public.therapy_videos
SET storage_bucket = COALESCE(storage_bucket, 'therapy-videos');

UPDATE public.therapy_videos
SET storage_path = COALESCE(
  NULLIF(storage_path, ''),
  CASE
    WHEN video_url LIKE '%/therapy-videos/%' THEN split_part(video_url, '/therapy-videos/', 2)
    ELSE video_url
  END
);

-- Normalize path if a full storage path accidentally got stored
UPDATE public.therapy_videos
SET storage_path = regexp_replace(storage_path, '^/?storage/v1/object/(public|sign)/therapy-videos/', '')
WHERE storage_path ~ '^/?storage/v1/object/(public|sign)/therapy-videos/';

ALTER TABLE public.therapy_videos
ALTER COLUMN storage_bucket SET DEFAULT 'therapy-videos';

-- 3) Tighten therapy_videos table policies
DROP POLICY IF EXISTS "Authenticated users can manage therapy videos" ON public.therapy_videos;
DROP POLICY IF EXISTS "Authenticated users can view therapy videos metadata" ON public.therapy_videos;

CREATE POLICY "Subscribed users can view therapy videos metadata"
ON public.therapy_videos
FOR SELECT
TO authenticated
USING (
  auth.role() = 'authenticated'
  AND (
    public.has_active_subscription(auth.uid())
    OR public.is_super_admin(auth.uid())
  )
);

CREATE POLICY "Super admins can insert therapy videos metadata"
ON public.therapy_videos
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_super_admin(auth.uid())
);

CREATE POLICY "Super admins can update therapy videos metadata"
ON public.therapy_videos
FOR UPDATE
TO authenticated
USING (
  public.is_super_admin(auth.uid())
)
WITH CHECK (
  public.is_super_admin(auth.uid())
);

CREATE POLICY "Super admins can delete therapy videos metadata"
ON public.therapy_videos
FOR DELETE
TO authenticated
USING (
  public.is_super_admin(auth.uid())
);

-- 4) Tighten storage.objects policies for therapy-videos bucket
DROP POLICY IF EXISTS "Authenticated users can view therapy videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload therapy videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update therapy videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete therapy videos" ON storage.objects;

CREATE POLICY "Subscribed users can view therapy videos files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'therapy-videos'
  AND (
    public.has_active_subscription(auth.uid())
    OR public.is_super_admin(auth.uid())
  )
);

CREATE POLICY "Super admins can upload therapy videos files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'therapy-videos'
  AND public.is_super_admin(auth.uid())
);

CREATE POLICY "Super admins can update therapy videos files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'therapy-videos'
  AND public.is_super_admin(auth.uid())
)
WITH CHECK (
  bucket_id = 'therapy-videos'
  AND public.is_super_admin(auth.uid())
);

CREATE POLICY "Super admins can delete therapy videos files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'therapy-videos'
  AND public.is_super_admin(auth.uid())
);