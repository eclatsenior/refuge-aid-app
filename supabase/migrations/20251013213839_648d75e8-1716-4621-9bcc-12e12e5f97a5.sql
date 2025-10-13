-- 1. Crear tabla mood_check_ins para historial de check-ins
CREATE TABLE IF NOT EXISTS public.mood_check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood_level integer NOT NULL CHECK (mood_level >= 1 AND mood_level <= 10),
  status text NOT NULL CHECK (status IN ('ok', 'anxious', 'alert')),
  location_data jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_mood_check_ins_employee_id ON public.mood_check_ins(employee_id);
CREATE INDEX IF NOT EXISTS idx_mood_check_ins_created_at ON public.mood_check_ins(created_at DESC);

-- RLS Policies para mood_check_ins
ALTER TABLE public.mood_check_ins ENABLE ROW LEVEL SECURITY;

-- Empleadas pueden insertar sus propios check-ins
CREATE POLICY "Employees can insert their own check-ins"
  ON public.mood_check_ins FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = employee_id);

-- Empleadas pueden ver sus propios check-ins
CREATE POLICY "Employees can view their own check-ins"
  ON public.mood_check_ins FOR SELECT
  TO authenticated
  USING (auth.uid() = employee_id);

-- Refugi Leads pueden ver check-ins de empleadas asignadas
CREATE POLICY "Refugi leads can view assigned employees check-ins"
  ON public.mood_check_ins FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() = 'refugi_lead' AND
    employee_id IN (
      SELECT employee_id 
      FROM public.employee_assignments 
      WHERE refugi_lead_id = auth.uid()
    )
  );

-- 2. Modificar employee_status para permitir NULL en mood_level
ALTER TABLE public.employee_status 
  ALTER COLUMN mood_level DROP NOT NULL;

-- Actualizar registros existentes que tienen valores arbitrarios
-- Solo poner NULL si nunca han hecho un check-in real (created_at = last_check_in)
UPDATE public.employee_status 
SET mood_level = NULL 
WHERE created_at = last_check_in OR last_check_in IS NULL;

-- 3. Crear función para calcular mood promedio de últimas 24 horas
CREATE OR REPLACE FUNCTION public.get_employee_average_mood_24h(emp_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(AVG(mood_level), NULL)
  FROM public.mood_check_ins
  WHERE employee_id = emp_id
    AND created_at >= now() - interval '24 hours';
$$;

-- Habilitar realtime para mood_check_ins
ALTER TABLE public.mood_check_ins REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mood_check_ins;