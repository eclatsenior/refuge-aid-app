import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Upload, Trash2, Video, Lock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const ROUTES = [
  { id: 'estabilizacion', name: 'Estabilización emocional' },
  { id: 'ansiedad', name: 'Ansiedad / Pánico' },
  { id: 'trauma', name: 'Trauma y disociación' },
  { id: 'violencia', name: 'Violencia de género' },
  { id: 'aromaterapia', name: 'Aromaterapia' }
];

const MODULES: Record<string, Array<{ id: string; name: string }>> = {
  estabilizacion: [
    { id: 'breathing', name: 'Respiración 4-7-8' },
    { id: 'grounding', name: 'Grounding 5-4-3-2-1' },
    { id: 'toolbox', name: 'Caja de herramientas' }
  ],
  ansiedad: [
    { id: 'wave', name: 'Atraviesa la ola' },
    { id: 'timer', name: 'Temporizador de crisis' },
    { id: 'tracking', name: 'Registro rápido' }
  ],
  trauma: [
    { id: 'safe', name: 'Espacio seguro' },
    { id: 'container', name: 'Técnica del contenedor' },
    { id: 'resources', name: 'Recursos internos' }
  ],
  violencia: [
    { id: 'safety', name: 'Plan de seguridad' },
    { id: 'boundaries', name: 'Límites saludables' },
    { id: 'support', name: 'Red de apoyo' }
  ],
  aromaterapia: [
    { id: 'intro', name: 'Introducción' },
    { id: 'practice', name: 'Práctica guiada' },
    { id: 'daily', name: 'Uso diario' }
  ]
};

/**
 * Sanitiza el nombre del archivo para Supabase Storage
 * - Remueve acentos y caracteres especiales
 * - Reemplaza espacios con guiones
 * - Convierte a minúsculas
 * - Preserva la extensión del archivo
 */
const sanitizeFileName = (fileName: string): string => {
  // Obtener extensión
  const lastDotIndex = fileName.lastIndexOf('.');
  const name = lastDotIndex > 0 ? fileName.slice(0, lastDotIndex) : fileName;
  const extension = lastDotIndex > 0 ? fileName.slice(lastDotIndex) : '';
  
  // Normalizar caracteres (convertir á → a, ñ → n, etc.)
  const normalized = name
    .normalize('NFD') // Descomponer caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Eliminar marcas diacríticas
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Reemplazar caracteres no alfanuméricos con guiones
    .replace(/^-+|-+$/g, ''); // Eliminar guiones al inicio/final
  
  return normalized + extension.toLowerCase();
};

export function AdminUploadVideosPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [videos, setVideos] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [selectedRoute, setSelectedRoute] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // TEMPORAL: Contraseña hardcodeada - cambiar a validación backend
  const ADMIN_PASSWORD = 'Refugi.admin.2025';

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      loadVideos();
    } else {
      toast({
        title: 'Contraseña incorrecta',
        variant: 'destructive'
      });
    }
  };

  const loadVideos = async () => {
    const { data } = await supabase
      .from('therapy_videos')
      .select('*')
      .order('created_at', { ascending: false });
    setVideos(data || []);
  };

  const handleUpload = async () => {
    console.log('🚀 handleUpload iniciado');
    console.log('📊 Estado actual:', {
      videoFile: videoFile?.name,
      size: videoFile?.size,
      type: videoFile?.type,
      selectedRoute,
      selectedModule,
      isRequired
    });

    // Verificar sesión de Supabase
    console.log('🔐 Verificando sesión de Supabase...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('🔐 Resultado de sesión:', {
      sessionExists: !!session,
      userId: session?.user?.id,
      error: sessionError
    });
    
    if (!session) {
      console.error('❌ No hay sesión de Supabase activa');
      toast({
        title: '⚠️ Sesión no válida',
        description: 'Por favor, inicia sesión en la aplicación principal primero',
        variant: 'destructive'
      });
      return;
    }

    console.log('✅ Sesión de Supabase verificada');

    // Validación de campos
    if (!videoFile || !selectedRoute || !selectedModule) {
      console.log('❌ Validación de campos fallida:', {
        hasVideoFile: !!videoFile,
        hasRoute: !!selectedRoute,
        hasModule: !!selectedModule
      });
      toast({ 
        title: 'Completa todos los campos', 
        description: 'Debes seleccionar un archivo de video, una ruta y un módulo',
        variant: 'destructive' 
      });
      return;
    }
    console.log('✅ Validación de campos completada');

    // Validar tipo de archivo
    if (!videoFile.type.startsWith('video/')) {
      console.error('❌ Tipo de archivo no válido:', videoFile.type);
      toast({
        title: 'Formato no válido',
        description: `Solo se permiten archivos de video. Tipo recibido: ${videoFile.type}`,
        variant: 'destructive'
      });
      return;
    }
    console.log('✅ Tipo de archivo validado:', videoFile.type);

    // Validar tamaño (250MB límite configurado)
    const maxSize = 250 * 1024 * 1024; // 250MB en bytes
    if (videoFile.size > maxSize) {
      console.error('❌ Archivo demasiado grande:', videoFile.size);
      toast({
        title: 'Archivo demasiado grande',
        description: `El tamaño máximo es 250MB. Tu archivo: ${(videoFile.size / 1024 / 1024).toFixed(2)}MB`,
        variant: 'destructive'
      });
      return;
    }
    console.log('✅ Tamaño de archivo validado:', (videoFile.size / 1024 / 1024).toFixed(2), 'MB');

    setUploading(true);
    setUploadProgress(0);

    try {
      console.log('🧹 Sanitizando nombre del archivo...');
      const sanitizedName = sanitizeFileName(videoFile.name);
      const fileName = `${selectedRoute}/${selectedModule}/${Date.now()}_${sanitizedName}`;
      console.log('📝 Nombre sanitizado:', {
        original: videoFile.name,
        sanitized: sanitizedName,
        fullPath: fileName
      });
      
      // Simular progreso para UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      console.log('☁️ Iniciando upload a Supabase Storage...');
      console.log('📦 Detalles del upload:', {
        bucket: 'therapy-videos',
        fileName,
        fileSize: videoFile.size
      });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('therapy-videos')
        .upload(fileName, videoFile);

      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (uploadError) {
        console.error('❌ Error de Supabase Storage:', uploadError);
        console.error('Stack trace:', uploadError);
        throw uploadError;
      }
      
      console.log('✅ Archivo subido exitosamente a Storage:', uploadData);

      console.log('🔗 Obteniendo URL pública del video...');
      const { data: urlData } = supabase.storage
        .from('therapy-videos')
        .getPublicUrl(fileName);
      
      console.log('🔗 URL pública obtenida:', urlData.publicUrl);

      console.log('💾 Insertando registro en base de datos...');
      const dbPayload = {
        route_id: selectedRoute,
        module_id: selectedModule,
        video_url: urlData.publicUrl,
        video_name: videoFile.name,
        file_size: videoFile.size,
        is_required: isRequired
      };
      console.log('📝 Payload para DB:', dbPayload);

      const { data: insertData, error: dbError } = await supabase
        .from('therapy_videos')
        .upsert(dbPayload);

      if (dbError) {
        console.error('❌ Error de base de datos:', dbError);
        console.error('Stack trace:', dbError);
        throw dbError;
      }

      console.log('✅ Registro insertado en DB exitosamente:', insertData);

      toast({ title: '✅ Video subido correctamente' });
      console.log('🔄 Recargando lista de videos...');
      loadVideos();
      
      console.log('🧹 Limpiando formulario...');
      setVideoFile(null);
      setSelectedRoute('');
      setSelectedModule('');
      setIsRequired(false);
      
      console.log('✅ Proceso completado exitosamente');
    } catch (error: any) {
      console.error('💥 ERROR CRÍTICO EN handleUpload:', error);
      console.error('📋 Detalles del error:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        fullError: error
      });
      
      toast({
        title: 'Error al subir video',
        description: error.message || 'Error desconocido. Revisa la consola para más detalles.',
        variant: 'destructive'
      });
    } finally {
      console.log('🏁 Finalizando proceso de upload...');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: string, videoUrl: string) => {
    if (!confirm('¿Eliminar este video?')) return;

    try {
      const urlObj = new URL(videoUrl);
      const pathParts = urlObj.pathname.split('/therapy-videos/')[1];
      
      await supabase.storage.from('therapy-videos').remove([pathParts]);
      await supabase.from('therapy_videos').delete().eq('id', id);
      
      toast({ title: '✅ Video eliminado' });
      loadVideos();
    } catch (error: any) {
      toast({
        title: 'Error al eliminar',
        description: error.message,
        variant: 'destructive'
      });
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

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">📹 Administrador de Videos</h1>

        <Card>
          <CardHeader>
            <CardTitle>Subir Nuevo Video</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Ruta Terapéutica</Label>
              <Select value={selectedRoute} onValueChange={setSelectedRoute}>
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
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              />
              {videoFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
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
            <CardTitle>Videos Subidos ({videos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {videos.map(video => (
                <div
                  key={video.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Video size={20} className="text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {ROUTES.find(r => r.id === video.route_id)?.name} →{' '}
                        {MODULES[video.route_id]?.find(m => m.id === video.module_id)?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {video.video_name}
                        {video.is_required && ' • 🔒 Obligatorio'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(video.id, video.video_url)}
                  >
                    <Trash2 size={16} className="text-destructive" />
                  </Button>
                </div>
              ))}

              {videos.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No hay videos subidos todavía
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}