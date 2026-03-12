import { useState, useEffect } from 'react';
import { supabase, SUPABASE_STORAGE_RESUMABLE_URL } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Upload, Trash2, Video, Lock, RefreshCw, ArrowLeft } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import * as tus from 'tus-js-client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const ROUTES = [
  { id: 'estabilizacion', name: 'Estabilización emocional' },
  { id: 'ansiedad', name: 'Ansiedad / Pánico' },
  { id: 'trauma', name: 'Trauma y disociación' },
  { id: 'aromaterapia', name: 'Aromaterapia' }
];

const MODULES: Record<string, Array<{ id: string; name: string }>> = {
  estabilizacion: [
    { id: 'breathing', name: 'Respiración 4-7-8' },
    { id: 'grounding', name: 'Grounding 5-4-3-2-1' }
  ],
  ansiedad: [
    { id: 'wave', name: 'Atraviesa la ola' },
    { id: 'timer', name: 'Temporizador de crisis' }
  ],
  trauma: [
    { id: 'grounding-intensive', name: 'Volver al presente' },
    { id: 'anchor-plan', name: 'Plan personal de anclaje' }
  ],
  aromaterapia: [
    { id: 'library', name: 'Biblioteca de aromas' },
    { id: 'routine', name: 'Rutina guiada de 3 minutos' },
    { id: 'alternatives', name: 'Alternativas sensoriales' }
  ]
};

/**
 * Sanitiza el nombre del archivo para Supabase Storage
 */
const sanitizeFileName = (fileName: string): string => {
  const lastDotIndex = fileName.lastIndexOf('.');
  const name = lastDotIndex > 0 ? fileName.slice(0, lastDotIndex) : fileName;
  const extension = lastDotIndex > 0 ? fileName.slice(lastDotIndex) : '';
  
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  return normalized + extension.toLowerCase();
};

interface AdminUploadVideosPageProps {
  embedded?: boolean;
  onBack?: () => void;
}

export function AdminUploadVideosPage({ embedded = false, onBack }: AdminUploadVideosPageProps) {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(embedded); // Skip password if embedded in super admin
  const [videos, setVideos] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [last413Error, setLast413Error] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  const [selectedRoute, setSelectedRoute] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // TEMPORAL: Contraseña hardcodeada - cambiar a validación backend
  const ADMIN_PASSWORD = 'Refugi.admin.2025';

  useEffect(() => {
    if (isAuthenticated) {
      loadVideos();
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      toast({
        title: 'Contraseña incorrecta',
        variant: 'destructive'
      });
    }
  };

  const loadVideos = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('therapy_videos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading videos:', error);
        toast({
          title: 'Error al cargar videos',
          description: error.message,
          variant: 'destructive'
        });
      }
      setVideos(data || []);
      setLastRefresh(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStoragePath = (videoUrlOrPath: string): string | null => {
    try {
      if (!videoUrlOrPath) return null;

      const marker = '/therapy-videos/';
      const idx = videoUrlOrPath.indexOf(marker);

      if (idx !== -1) {
        const path = videoUrlOrPath.substring(idx + marker.length);
        return decodeURIComponent(path);
      }

      // Already a relative storage path
      return decodeURIComponent(videoUrlOrPath.replace(/^\/+/, ''));
    } catch (e) {
      console.error('Error parsing video URL/path:', e);
      return null;
    }
  };

  const handleUpload = async () => {
    console.log('🚀 handleUpload iniciado');
    
    // Verificar sesión de Supabase
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: '⚠️ Sesión no válida',
        description: 'Por favor, inicia sesión en la aplicación principal primero. Necesitas estar autenticado para subir videos.',
        variant: 'destructive'
      });
      return;
    }

    // Validación de campos
    if (!videoFile || !selectedRoute || !selectedModule) {
      toast({ 
        title: 'Completa todos los campos', 
        description: 'Debes seleccionar un archivo de video, una ruta y un módulo',
        variant: 'destructive' 
      });
      return;
    }

    // Validar tipo de archivo
    if (!videoFile.type.startsWith('video/')) {
      toast({
        title: 'Formato no válido',
        description: 'Solo se permiten archivos de video',
        variant: 'destructive'
      });
      return;
    }

    // Validar tamaño (250MB límite configurado)
    const maxSize = 250 * 1024 * 1024;
    if (videoFile.size > maxSize) {
      toast({
        title: 'Archivo demasiado grande',
        description: `El tamaño máximo es 250MB. Tu archivo: ${(videoFile.size / 1024 / 1024).toFixed(2)}MB`,
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const sanitizedName = sanitizeFileName(videoFile.name);
      const fileName = `${selectedRoute}/${selectedModule}/${Date.now()}_${sanitizedName}`;
      const largeFileThreshold = 50 * 1024 * 1024; // 50MB
      let storagePath: string;

      if (videoFile.size > largeFileThreshold) {
        // Usar TUS (subida reanudable) para archivos > 50MB
        console.log('📤 Archivo grande detectado, usando subida reanudable (TUS)...');
        
        publicUrl = await new Promise<string>((resolve, reject) => {
          const upload = new tus.Upload(videoFile, {
            endpoint: SUPABASE_STORAGE_RESUMABLE_URL,
            retryDelays: [0, 3000, 5000, 10000, 20000],
            headers: {
              authorization: `Bearer ${session.access_token}`,
              'x-upsert': 'false'
            },
            uploadDataDuringCreation: true,
            removeFingerprintOnSuccess: true,
            metadata: {
              bucketName: 'therapy-videos',
              objectName: fileName,
              contentType: videoFile.type || 'video/mp4',
              cacheControl: '3600'
            },
            chunkSize: 6 * 1024 * 1024, // 6MB chunks
            onError: (error) => {
              console.error('❌ Error en subida TUS:', error);
              
              const errorMessage = error.message || error.toString();
              if (errorMessage.includes('413') || errorMessage.toLowerCase().includes('maximum size exceeded')) {
                setLast413Error(true);
                toast({
                  title: '⚠️ Límite de tamaño del proyecto excedido',
                  description: 'El límite global de Supabase es 50MB. Para subir archivos mayores: (1) Aumenta el límite en el Dashboard de Supabase (requiere plan Pro), o (2) Comprime el video.',
                  variant: 'destructive'
                });
              }
              
              reject(error);
            },
            onProgress: (bytesUploaded, bytesTotal) => {
              const percentage = (bytesUploaded / bytesTotal) * 100;
              setUploadProgress(percentage);
            },
            onSuccess: () => {
              console.log('✅ Subida TUS completada');
              const { data: { publicUrl: url } } = supabase.storage
                .from('therapy-videos')
                .getPublicUrl(fileName);
              resolve(url);
            }
          });

          upload.findPreviousUploads().then((previousUploads) => {
            if (previousUploads.length) {
              upload.resumeFromPreviousUpload(previousUploads[0]);
            }
            upload.start();
          });
        });
      } else {
        // Usar método estándar para archivos <= 50MB
        console.log('📤 Usando subida estándar...');
        
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('therapy-videos')
          .upload(fileName, videoFile, {
            cacheControl: '3600',
            upsert: false
          });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (uploadError) throw uploadError;

        const { data: { publicUrl: url } } = supabase.storage
          .from('therapy-videos')
          .getPublicUrl(fileName);
        
        publicUrl = url;
      }

      // Insertar en base de datos
      const { error: dbError } = await supabase
        .from('therapy_videos')
        .insert({
          route_id: selectedRoute,
          module_id: selectedModule,
          video_url: publicUrl,
          video_name: videoFile.name,
          file_size: videoFile.size,
          is_required: isRequired
        });

      if (dbError) throw dbError;

      toast({ title: '✅ Video subido correctamente' });
      loadVideos();
      
      // Reset form
      setVideoFile(null);
      setSelectedRoute('');
      setSelectedModule('');
      setIsRequired(false);
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      console.error('❌ Error:', error);
      toast({
        title: 'Error al subir video',
        description: error.message || 'Error desconocido',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: string, videoUrl: string) => {
    if (!confirm('¿Eliminar este video? Esta acción no se puede deshacer.')) return;

    setDeleting(id);
    try {
      // 1. Delete from database first
      const { error: dbError } = await supabase
        .from('therapy_videos')
        .delete()
        .eq('id', id);
      
      if (dbError) {
        console.error('❌ Error deleting from DB:', dbError);
        throw new Error(`Error eliminando registro: ${dbError.message}`);
      }

      // 2. Try to delete from storage (non-blocking)
      const storagePath = getStoragePath(videoUrl);
      if (storagePath) {
        console.log('🗑️ Deleting from storage:', storagePath);
        const { error: storageError } = await supabase.storage
          .from('therapy-videos')
          .remove([storagePath]);
        
        if (storageError) {
          console.warn('⚠️ Storage deletion failed (non-critical):', storageError);
        }
      }
      
      toast({ title: '✅ Video eliminado' });
      // Update local state immediately
      setVideos(prev => prev.filter(v => v.id !== id));
    } catch (error: any) {
      console.error('❌ Delete error:', error);
      toast({
        title: 'Error al eliminar',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setDeleting(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock size={20} />
              Admin - Subir Videos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Contraseña de administrador"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <Button onClick={handleLogin} className="w-full">
              Entrar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        {onBack && (
          <Button onClick={onBack} variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <h1 className="text-2xl font-bold">📹 Administrador de Videos</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subir Nuevo Video</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Ruta Terapéutica</Label>
            <Select value={selectedRoute} onValueChange={(val) => { setSelectedRoute(val); setSelectedModule(''); }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona ruta" />
              </SelectTrigger>
              <SelectContent>
                {ROUTES.map(route => (
                  <SelectItem key={route.id} value={route.id}>
                    {route.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedRoute && (
            <div>
              <Label>Módulo</Label>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona módulo" />
                </SelectTrigger>
                <SelectContent>
                  {MODULES[selectedRoute]?.map(module => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Archivo de Video (MP4, WebM)</Label>
            <Input
              type="file"
              accept="video/*"
              onChange={(e) => {
                setVideoFile(e.target.files?.[0] || null);
                setLast413Error(false);
              }}
            />
            {videoFile && (
              <p className="text-sm text-muted-foreground mt-1">
                {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
            {last413Error && (
              <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive font-medium">⚠️ Límite del proyecto: 50MB</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tu proyecto tiene un límite global de 50MB por archivo. Opciones:
                </p>
                <ul className="text-xs text-muted-foreground mt-1 ml-4 list-disc space-y-0.5">
                  <li>Aumenta el límite en <a href="https://supabase.com/dashboard/project/npmyobeqbipvvuaeswnu/settings/storage" target="_blank" rel="noopener noreferrer" className="underline">Dashboard → Storage Settings</a> (requiere plan Pro)</li>
                  <li>Comprime el video con herramientas como HandBrake o FFmpeg</li>
                </ul>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={isRequired}
              onCheckedChange={setIsRequired}
            />
            <Label>Video obligatorio (bloquea avance hasta verlo)</Label>
          </div>

          {uploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-sm text-center">{uploadProgress.toFixed(0)}%</p>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={uploading || !videoFile || !selectedRoute || !selectedModule}
            className="w-full"
          >
            <Upload size={16} className="mr-2" />
            {uploading ? 'Subiendo...' : 'Subir Video'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Videos Subidos ({videos.length})</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Actualizado hace {formatDistanceToNow(lastRefresh, { locale: es, addSuffix: false })}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadVideos}
              disabled={isRefreshing}
            >
              <RefreshCw size={16} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Recargar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {videos.map(video => (
              <div
                key={video.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Video size={20} className="text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {ROUTES.find(r => r.id === video.route_id)?.name || video.route_id} →{' '}
                      {MODULES[video.route_id]?.find(m => m.id === video.module_id)?.name || video.module_id}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {video.video_name}
                      {video.is_required && ' • 🔒 Obligatorio'}
                      {video.file_size && ` • ${(video.file_size / 1024 / 1024).toFixed(1)} MB`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(video.id, video.video_url)}
                  disabled={deleting === video.id}
                >
                  {deleting === video.id ? (
                    <RefreshCw size={16} className="animate-spin text-muted-foreground" />
                  ) : (
                    <Trash2 size={16} className="text-destructive" />
                  )}
                </Button>
              </div>
            ))}

            {videos.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-2">
                  No hay videos subidos todavía
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadVideos}
                >
                  <RefreshCw size={14} className="mr-1" />
                  Reintentar carga
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {content}
      </div>
    </div>
  );
}
