
-- Create therapy_routes table for dynamic route management
CREATE TABLE public.therapy_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_key text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  duration text NOT NULL DEFAULT '5-8 min',
  icon text NOT NULL DEFAULT 'heart',
  color text NOT NULL DEFAULT 'blue',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create therapy_modules table for dynamic module management
CREATE TABLE public.therapy_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES public.therapy_routes(id) ON DELETE CASCADE,
  module_key text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  duration integer NOT NULL DEFAULT 5,
  type text NOT NULL DEFAULT 'breathing',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(route_id, module_key)
);

-- Enable RLS
ALTER TABLE public.therapy_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapy_modules ENABLE ROW LEVEL SECURITY;

-- RLS policies: everyone can read active routes/modules
CREATE POLICY "Anyone can view active therapy routes"
  ON public.therapy_routes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view active therapy modules"
  ON public.therapy_modules FOR SELECT
  USING (true);

-- Only super admins can manage (via edge function with service role)
-- No direct insert/update/delete policies for regular users

-- Triggers for updated_at
CREATE TRIGGER update_therapy_routes_updated_at
  BEFORE UPDATE ON public.therapy_routes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_therapy_modules_updated_at
  BEFORE UPDATE ON public.therapy_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed existing routes
INSERT INTO public.therapy_routes (route_key, title, description, duration, icon, color, sort_order) VALUES
  ('estabilizacion', 'Estabilización emocional', 'Baja la intensidad y regresa al ahora.', '5-8 min', 'heart', 'blue', 1),
  ('ansiedad', 'Ansiedad / Pánico', 'Guía breve para atravesar el pico.', '5-8 min', 'wind', 'coral', 2),
  ('trauma', 'Trauma y disociación', 'Anclajes cuando te desconectas.', '8-12 min', 'shield', 'gray-gradient', 3),
  ('aromaterapia', 'Aromaterapia', 'Calma a través del sentido del olfato.', '6-12 min', 'flower', 'green', 4);

-- Seed existing modules
INSERT INTO public.therapy_modules (route_id, module_key, title, description, content, duration, type, sort_order)
SELECT r.id, 'breathing', 'Respiración 4-7-8', 'Técnica de respiración para calmar el sistema nervioso', 'La respiración 4-7-8 ayuda a activar el sistema nervioso parasimpático, reduciendo la ansiedad y promoviendo la calma.', 5, 'breathing', 1
FROM public.therapy_routes r WHERE r.route_key = 'estabilizacion';

INSERT INTO public.therapy_modules (route_id, module_key, title, description, content, duration, type, sort_order)
SELECT r.id, 'grounding', 'Grounding 5-4-3-2-1', 'Ejercicio de conexión con el presente', 'Este ejercicio te ayuda a reconectar con el momento presente usando tus cinco sentidos.', 3, 'grounding', 2
FROM public.therapy_routes r WHERE r.route_key = 'estabilizacion';

INSERT INTO public.therapy_modules (route_id, module_key, title, description, content, duration, type, sort_order)
SELECT r.id, 'wave', 'Atraviesa la ola', 'Audio guiado para crisis de pánico', 'Recordar: el pánico es como una ola. Tiene un pico y después baja. No luches contra ella, déjala pasar.', 5, 'breathing', 1
FROM public.therapy_routes r WHERE r.route_key = 'ansiedad';

INSERT INTO public.therapy_modules (route_id, module_key, title, description, content, duration, type, sort_order)
SELECT r.id, 'timer', 'Temporizador de crisis', 'Instrucciones paso a paso con cronómetro', 'Un temporizador que te guía minuto a minuto durante una crisis de ansiedad.', 3, 'tool', 2
FROM public.therapy_routes r WHERE r.route_key = 'ansiedad';

INSERT INTO public.therapy_modules (route_id, module_key, title, description, content, duration, type, sort_order)
SELECT r.id, 'grounding-intensive', 'Volver al presente', 'Botón de anclaje inmediato', 'Técnicas intensivas de grounding para momentos de disociación.', 2, 'grounding', 1
FROM public.therapy_routes r WHERE r.route_key = 'trauma';

INSERT INTO public.therapy_modules (route_id, module_key, title, description, content, duration, type, sort_order)
SELECT r.id, 'anchor-plan', 'Plan personal de anclaje', 'Estrategias personalizadas para reconectar', 'Desarrolla tu plan personalizado de técnicas que te ayuden a volver al presente.', 8, 'tool', 2
FROM public.therapy_routes r WHERE r.route_key = 'trauma';

INSERT INTO public.therapy_modules (route_id, module_key, title, description, content, duration, type, sort_order)
SELECT r.id, 'library', 'Biblioteca de aromas', 'Conoce los aceites esenciales, sus beneficios y contraindicaciones', 'Conoce los diferentes aceites esenciales y sus efectos calmantes. Elige el aceite que resuene contigo y acompáñalo de respiración con cada módulo.', 5, 'education', 1
FROM public.therapy_routes r WHERE r.route_key = 'aromaterapia';

INSERT INTO public.therapy_modules (route_id, module_key, title, description, content, duration, type, sort_order)
SELECT r.id, 'routine', 'Rutina guiada de 3 minutos', 'Sesión corta de aromaterapia', 'Una rutina breve que combina aromaterapia con respiración consciente.', 3, 'breathing', 2
FROM public.therapy_routes r WHERE r.route_key = 'aromaterapia';

INSERT INTO public.therapy_modules (route_id, module_key, title, description, content, duration, type, sort_order)
SELECT r.id, 'alternatives', 'Alternativas sensoriales', 'Opciones si no tienes aceites', 'Técnicas alternativas usando otros sentidos cuando no tienes aceites esenciales.', 3, 'tool', 3
FROM public.therapy_routes r WHERE r.route_key = 'aromaterapia';
