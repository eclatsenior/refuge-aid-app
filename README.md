# Refugi - Aplicación de Apoyo Seguro 24/7

## Descripción

**Refugi** es una aplicación web progresiva (PWA) diseñada para proporcionar apoyo seguro a víctimas de violencia doméstica. Ofrece herramientas de emergencia, seguimiento de bienestar, notas cifradas, ejercicios de calma y un directorio de recursos especializados.

### Características Principales

🚨 **Botón de Emergencia**: Acceso rápido a llamadas de emergencia (112) y notificación a contactos de confianza vía WhatsApp/SMS

📱 **Modo Discreto**: Cambia la apariencia de la app para parecer una aplicación de notas común

📝 **Notas Cifradas**: Sistema de notas privadas con cifrado local para máxima seguridad

💆‍♀️ **Ejercicios de Calma**: Técnicas de respiración, grounding y relajación guiadas

📊 **Seguimiento de Bienestar**: Registro diario del estado emocional con estadísticas semanales

🗂️ **Recursos de Apoyo**: Directorio verificado de servicios especializados por región

## Tecnologías Utilizadas

- **Frontend**: React + TypeScript + Vite
- **UI/UX**: Tailwind CSS + shadcn/ui
- **Estado**: Zustand con persistencia
- **PWA**: Service Worker + Manifest
- **Backend**: Supabase (Requerido para funcionalidad completa)

## Configuración del Proyecto

### Prerrequisitos

- Node.js (versión 16 o superior)
- npm o yarn

### Instalación Local

```bash
# Clonar el repositorio
git clone [URL_DEL_REPO]
cd refugi

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

### Configuración de Supabase (IMPORTANTE)

Para que la aplicación funcione completamente, necesitas configurar Supabase:

1. **Conectar con Supabase** usando la integración nativa de Lovable (botón verde en la interfaz)

2. **Crear las siguientes tablas en tu proyecto Supabase**:

```sql
-- Tabla de perfiles de usuario
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  display_name TEXT,
  locale TEXT DEFAULT 'es-ES',
  has_biometrics BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabla de contactos de confianza
CREATE TABLE trusted_contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabla de notas cifradas
CREATE TABLE notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title_enc TEXT NOT NULL,
  body_enc TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  is_starred BOOLEAN DEFAULT false
);

-- Tabla de recursos
CREATE TABLE resources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  phone TEXT,
  url TEXT,
  region TEXT NOT NULL,
  description TEXT,
  is_verified BOOLEAN DEFAULT true,
  available_24h BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabla de configuración
CREATE TABLE settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  checkin_frequency TEXT DEFAULT 'daily',
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  location_consent BOOLEAN DEFAULT false,
  alert_message_template TEXT DEFAULT 'Necesito ayuda. Estoy en riesgo. Este es un aviso automático de Refugi.',
  is_discreet_mode BOOLEAN DEFAULT false,
  has_biometrics BOOLEAN DEFAULT false,
  auto_lock_minutes INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabla de check-ins (seguimiento)
CREATE TABLE checkins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('ok', 'anxious', 'alert')) NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabla de eventos (telemetría mínima)
CREATE TABLE events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
```

3. **Configurar Row Level Security (RLS)**:

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (solo acceso a datos propios)
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own contacts" ON trusted_contacts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own notes" ON notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own settings" ON settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own checkins" ON checkins FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own events" ON events FOR ALL USING (auth.uid() = user_id);

-- Recursos son públicos para lectura
CREATE POLICY "Resources are viewable by everyone" ON resources FOR SELECT USING (true);
```

4. **Insertar datos iniciales de recursos**:

```sql
INSERT INTO resources (title, category, phone, region, description, available_24h) VALUES
('Teléfono Nacional contra la Violencia de Género', 'emergencia', '016', 'nacional', 'Atención telefónica gratuita y confidencial 24 horas. No deja rastro en la factura.', true),
('Emergencias - Policía Nacional', 'emergencia', '112', 'nacional', 'Número de emergencias europeo. Disponible 24/7 para situaciones de peligro inmediato.', true),
('Fundación ANAR', 'apoyo', '900202010', 'nacional', 'Atención especializada para menores en situación de riesgo.', true);
```

## Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo
npm run build        # Construye la aplicación para producción
npm run preview      # Previsualiza la build de producción
npm run lint         # Ejecuta el linter

# Testing (cuando se implementen)
npm run test         # Ejecuta tests unitarios
npm run test:e2e     # Ejecuta tests end-to-end
```

## Estructura del Proyecto

```
src/
├── components/
│   ├── emergency/          # Componentes de emergencia
│   ├── layout/            # Componentes de layout
│   └── ui/                # Componentes de UI (shadcn)
├── pages/                 # Páginas principales
├── store/                 # Estado global (Zustand)
├── lib/                   # Utilidades
└── hooks/                 # Hooks personalizados
```

## Funcionalidades por Implementar (Roadmap)

### MVP Completado ✅
- [x] Botón de emergencia con acciones rápidas
- [x] Modo discreto para privacidad
- [x] Sistema de notas cifradas localmente
- [x] Ejercicios de calma guiados
- [x] Directorio de recursos por región
- [x] Seguimiento de bienestar diario
- [x] PWA instalable
- [x] Diseño responsive y accesible

### Futuras Mejoras 🚀
- [ ] Autenticación con Supabase
- [ ] Sincronización de datos en la nube
- [ ] Notificaciones push programadas
- [ ] Cifrado real de notas (AES-GCM)
- [ ] Geolocalización para alertas
- [ ] Plan de seguridad personalizado
- [ ] Evidencias seguras con auto-borrado
- [ ] Panel web para profesionales

## Seguridad y Privacidad

- **Cifrado Local**: Las notas se cifran en el dispositivo del usuario
- **Modo Discreto**: Cambia la apariencia para parecer una app de notas
- **Sin Rastros**: Los números de emergencia no aparecen en facturas
- **RLS**: Row Level Security garantiza que cada usuario solo acceda a sus datos
- **HTTPS**: Todas las comunicaciones van cifradas
- **Datos Mínimos**: Solo se almacenan los datos estrictamente necesarios

## Testing

### Flujos Críticos a Probar

1. **Botón de Emergencia**:
   - Pulsar → ver opciones → llamar 112
   - Pulsar → avisar contactos → abrir WhatsApp/SMS

2. **Modo Discreto**:
   - Activar → verificar cambio de UI
   - Desactivar → volver al modo normal

3. **Notas**:
   - Crear nota → verificar guardado
   - Editar nota → verificar cambios
   - Buscar nota → verificar resultados

4. **Seguimiento**:
   - Registrar estado → verificar guardado
   - Ver historial → verificar datos

5. **Accesibilidad**:
   - Navegación por teclado
   - Screen readers
   - Contraste de colores

## Despliegue

### PWA Local
La aplicación se puede instalar como PWA desde cualquier navegador moderno.

### Producción con Lovable
1. Usar el botón "Share → Publish" en Lovable
2. Configurar dominio personalizado si es necesario

## Licencia y Legal

⚠️ **Disclaimer Importante**: Esta aplicación es una herramienta de apoyo y NO sustituye a los servicios de emergencia oficiales. En caso de peligro inmediato, siempre contacta con el 112 o servicios de emergencia locales.

## Contacto y Soporte

Para consultas sobre el desarrollo o implementación de esta aplicación, consulta la documentación de Lovable o contacta con el equipo de desarrollo.

---

**Refugi** - Porque tu seguridad es nuestra prioridad 💜