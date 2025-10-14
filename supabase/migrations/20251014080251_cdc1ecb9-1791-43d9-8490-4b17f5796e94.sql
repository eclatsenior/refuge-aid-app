-- FASE 1: Feature Flags y Tablas Base (CORREGIDO)
-- Crear tabla de Feature Flags
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name TEXT UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar flags iniciales
INSERT INTO public.feature_flags (flag_name, description, is_enabled) VALUES
  ('ff_refugi_kpis', 'Métricas KPI avanzadas en dashboard', false),
  ('ff_refugi_queue', 'Cola "Necesita atención ahora"', false),
  ('ff_refugi_cases', 'Gestión de casos y playbooks', false),
  ('ff_refugi_pdf', 'Exportación de informes PDF', false),
  ('ff_refugi_privacy', 'Modo privacidad/anónimo', false),
  ('ff_refugi_training', 'Tracking de formación', false)
ON CONFLICT (flag_name) DO NOTHING;

-- RLS para feature_flags
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RefugiLead can read flags" ON public.feature_flags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'refugi_lead'
    )
  );

-- Tabla risk_scores
CREATE TABLE IF NOT EXISTS public.risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score_int INTEGER CHECK (score_int BETWEEN 0 AND 100),
  explain_chips TEXT[] DEFAULT '{}',
  trend_7d NUMERIC,
  trend_30d NUMERIC,
  calculated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_risk_scores_employee ON public.risk_scores(employee_id);
CREATE INDEX idx_risk_scores_calculated ON public.risk_scores(calculated_at DESC);

ALTER TABLE public.risk_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RefugiLead can view risk scores" ON public.risk_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'refugi_lead'
    )
  );

-- Tabla incidents
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  opened_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ,
  sla_target_mins INTEGER DEFAULT 240,
  sla_breached_bool BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_incidents_employee ON public.incidents(employee_id);
CREATE INDEX idx_incidents_status ON public.incidents(status);
CREATE INDEX idx_incidents_opened ON public.incidents(opened_at DESC);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RefugiLead can manage incidents" ON public.incidents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'refugi_lead'
    )
  );

-- Tabla cases
CREATE TABLE IF NOT EXISTS public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state TEXT DEFAULT 'nuevo',
  playbook TEXT,
  owner_user_id UUID REFERENCES auth.users(id),
  next_action_at TIMESTAMPTZ,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cases_employee ON public.cases(employee_id);
CREATE INDEX idx_cases_state ON public.cases(state);
CREATE INDEX idx_cases_owner ON public.cases(owner_user_id);

ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RefugiLead can manage cases" ON public.cases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'refugi_lead'
    )
  );

-- Tabla psych_referrals
CREATE TABLE IF NOT EXISTS public.psych_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'requested',
  provider_name TEXT,
  appointment_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_psych_employee ON public.psych_referrals(employee_id);
CREATE INDEX idx_psych_case ON public.psych_referrals(case_id);

ALTER TABLE public.psych_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RefugiLead can manage referrals" ON public.psych_referrals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'refugi_lead'
    )
  );

-- Añadir columna is_anonymous a mood_check_ins
ALTER TABLE public.mood_check_ins 
  ADD COLUMN IF NOT EXISTS is_anonymous_bool BOOLEAN DEFAULT false;

-- Tabla training_completions
CREATE TABLE IF NOT EXISTS public.training_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_code TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_training_employee ON public.training_completions(employee_id);
CREATE INDEX idx_training_course ON public.training_completions(course_code);

ALTER TABLE public.training_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RefugiLead can view training" ON public.training_completions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'refugi_lead'
    )
  );

-- Tabla reports
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  scope JSONB DEFAULT '{}',
  generated_by UUID REFERENCES auth.users(id),
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reports_period ON public.reports(period_start, period_end);
CREATE INDEX idx_reports_generated_by ON public.reports(generated_by);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RefugiLead can manage reports" ON public.reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'refugi_lead'
    )
  );

-- Tabla hris_employees_sync
CREATE TABLE IF NOT EXISTS public.hris_employees_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,
  employee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  department TEXT,
  location TEXT,
  shift TEXT,
  status TEXT DEFAULT 'active',
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hris_employee ON public.hris_employees_sync(employee_id);
CREATE INDEX idx_hris_external ON public.hris_employees_sync(external_id);

ALTER TABLE public.hris_employees_sync ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RefugiLead can view HRIS data" ON public.hris_employees_sync
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'refugi_lead'
    )
  );

-- Tabla audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_created ON public.audit_logs(created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RefugiLead can view audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'refugi_lead'
    )
  );

-- FASE 2: Funciones de Base de Datos (CORREGIDO)
-- Función de cálculo de riesgo
CREATE OR REPLACE FUNCTION public.calculate_risk_score(emp_id UUID)
RETURNS TABLE(score INTEGER, chips TEXT[], trend_7d NUMERIC, trend_30d NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score INTEGER := 0;
  v_chips TEXT[] := '{}';
  v_sos_count INTEGER;
  v_mood_diff NUMERIC;
  v_inactive BOOLEAN;
  v_high_risk_shift BOOLEAN;
  v_open_incidents INTEGER;
BEGIN
  -- 1. SOS recientes
  SELECT COUNT(*) INTO v_sos_count
  FROM emergency_alerts
  WHERE employee_id = emp_id 
    AND created_at >= now() - interval '14 days'
    AND NOT is_resolved;
  
  IF v_sos_count > 0 THEN
    v_score := v_score + (v_sos_count * 20);
    v_chips := array_append(v_chips, 'SOS×' || v_sos_count);
  END IF;

  -- 2. Caída de ánimo (corregido: usar subconsulta)
  SELECT COALESCE(MAX(mood_level) - MIN(mood_level), 0) INTO v_mood_diff
  FROM (
    SELECT mood_level FROM mood_check_ins
    WHERE employee_id = emp_id
      AND created_at >= now() - interval '72 hours'
    ORDER BY created_at DESC
    LIMIT 2
  ) recent_moods;
  
  IF v_mood_diff >= 2 THEN
    v_score := v_score + 25;
    v_chips := array_append(v_chips, 'Ánimo↓');
  END IF;

  -- 3. Inactividad
  SELECT NOT EXISTS(
    SELECT 1 FROM mood_check_ins
    WHERE employee_id = emp_id
      AND created_at >= now() - interval '7 days'
  ) INTO v_inactive;
  
  IF v_inactive THEN
    v_score := v_score + 15;
    v_chips := array_append(v_chips, 'Inactiva');
  END IF;

  -- 4. Turno de riesgo
  SELECT COALESCE(shift = 'night', false) INTO v_high_risk_shift
  FROM hris_employees_sync
  WHERE employee_id = emp_id
  LIMIT 1;
  
  IF v_high_risk_shift THEN
    v_score := v_score + 10;
    v_chips := array_append(v_chips, 'Turno noche');
  END IF;

  -- 5. Incidentes abiertos
  SELECT COUNT(*) INTO v_open_incidents
  FROM incidents
  WHERE employee_id = emp_id
    AND status IN ('open', 'in_progress');
  
  IF v_open_incidents > 0 THEN
    v_score := v_score + (v_open_incidents * 15);
    v_chips := array_append(v_chips, 'Inc×' || v_open_incidents);
  END IF;

  v_score := LEAST(v_score, 100);

  RETURN QUERY SELECT 
    v_score,
    v_chips,
    NULL::NUMERIC AS trend_7d,
    NULL::NUMERIC AS trend_30d;
END;
$$;

-- Función para obtener KPIs
CREATE OR REPLACE FUNCTION public.get_dashboard_kpis(scope_filter JSONB DEFAULT '{}')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'active_risk', (
      SELECT jsonb_build_object(
        'score', COALESCE(AVG(score_int), 0),
        'trend_7d', COALESCE(AVG(trend_7d), 0),
        'trend_30d', COALESCE(AVG(trend_30d), 0)
      )
      FROM risk_scores
      WHERE calculated_at >= now() - interval '1 day'
    ),
    'incidents_today', (
      SELECT COUNT(*) FROM incidents WHERE opened_at::DATE = CURRENT_DATE
    ),
    'incidents_week', (
      SELECT COUNT(*) FROM incidents WHERE opened_at >= now() - interval '7 days'
    ),
    'incidents_open', (
      SELECT COUNT(*) FROM incidents WHERE status = 'open'
    ),
    'incidents_in_progress', (
      SELECT COUNT(*) FROM incidents WHERE status = 'in_progress'
    ),
    'incidents_closed', (
      SELECT COUNT(*) FROM incidents WHERE status = 'closed' AND closed_at >= now() - interval '7 days'
    ),
    'avg_mood', (
      SELECT COALESCE(AVG(mood_level), 0)
      FROM mood_check_ins
      WHERE created_at >= now() - interval '24 hours'
    ),
    'checkins_count', (
      SELECT COUNT(*) FROM mood_check_ins WHERE created_at >= now() - interval '7 days'
    ),
    'training_completion', (
      SELECT COALESCE(
        (COUNT(DISTINCT employee_id)::FLOAT / NULLIF((SELECT COUNT(DISTINCT user_id) FROM profiles WHERE role = 'employee'), 0)) * 100,
        0
      )
      FROM training_completions
      WHERE course_code IN ('VG_101', 'ACOSO_PREV')
    )
  ) INTO result;

  RETURN result;
END;
$$;