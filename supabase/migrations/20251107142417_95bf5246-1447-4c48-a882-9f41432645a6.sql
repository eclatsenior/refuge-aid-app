-- Crear bucket para videos de terapias
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'therapy-videos', 
  'therapy-videos', 
  true,
  524288000,
  ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
);

-- RLS: Cualquiera puede ver videos
CREATE POLICY "Anyone can view therapy videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'therapy-videos');

-- RLS: Solo usuarios autenticados pueden subir
CREATE POLICY "Authenticated users can upload therapy videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'therapy-videos' 
  AND auth.role() = 'authenticated'
);

-- RLS: Solo usuarios autenticados pueden actualizar
CREATE POLICY "Authenticated users can update therapy videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'therapy-videos' 
  AND auth.role() = 'authenticated'
);

-- RLS: Solo usuarios autenticados pueden eliminar
CREATE POLICY "Authenticated users can delete therapy videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'therapy-videos' 
  AND auth.role() = 'authenticated'
);

-- Crear tabla para metadata de videos
CREATE TABLE therapy_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  video_url TEXT NOT NULL,
  video_name TEXT,
  file_size BIGINT,
  duration_seconds INTEGER,
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(route_id, module_id)
);

-- RLS: Todos pueden leer videos
CREATE POLICY "Anyone can view therapy videos metadata"
ON therapy_videos FOR SELECT
TO public
USING (true);

-- RLS: Solo usuarios autenticados pueden gestionar
CREATE POLICY "Authenticated users can manage therapy videos"
ON therapy_videos FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Índices para búsqueda rápida
CREATE INDEX idx_therapy_videos_route ON therapy_videos(route_id);
CREATE INDEX idx_therapy_videos_module ON therapy_videos(route_id, module_id);