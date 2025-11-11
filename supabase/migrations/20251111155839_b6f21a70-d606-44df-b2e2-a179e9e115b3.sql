-- Create app_sessions table for tracking app usage
CREATE TABLE IF NOT EXISTS public.app_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_app_sessions_employee_id ON public.app_sessions(employee_id);
CREATE INDEX IF NOT EXISTS idx_app_sessions_started_at ON public.app_sessions(started_at);

-- Enable RLS
ALTER TABLE public.app_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Employees can insert their own sessions"
  ON public.app_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Employees can view their own sessions"
  ON public.app_sessions
  FOR SELECT
  USING (auth.uid() = employee_id);

CREATE POLICY "Refugi leads can view assigned employees sessions"
  ON public.app_sessions
  FOR SELECT
  USING (
    get_current_user_role() = 'refugi_lead' AND
    employee_id IN (
      SELECT employee_id FROM employee_assignments WHERE refugi_lead_id = auth.uid()
    )
  );

-- Create video_progress table for tracking therapy video completion
CREATE TABLE IF NOT EXISTS public.video_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  video_id UUID NOT NULL REFERENCES public.therapy_videos(id) ON DELETE CASCADE,
  route_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  watched_duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_video_progress_employee_id ON public.video_progress(employee_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_video_id ON public.video_progress(video_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_route_module ON public.video_progress(route_id, module_id);

-- Enable RLS
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Employees can insert their own progress"
  ON public.video_progress
  FOR INSERT
  WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Employees can view their own progress"
  ON public.video_progress
  FOR SELECT
  USING (auth.uid() = employee_id);

CREATE POLICY "Refugi leads can view assigned employees progress"
  ON public.video_progress
  FOR SELECT
  USING (
    get_current_user_role() = 'refugi_lead' AND
    employee_id IN (
      SELECT employee_id FROM employee_assignments WHERE refugi_lead_id = auth.uid()
    )
  );