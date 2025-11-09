-- Actualizar el límite de tamaño del bucket therapy-videos a 250MB
UPDATE storage.buckets 
SET file_size_limit = 262144000  -- 250MB en bytes (250 * 1024 * 1024)
WHERE id = 'therapy-videos';