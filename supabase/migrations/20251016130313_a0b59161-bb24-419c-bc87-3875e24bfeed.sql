-- Create lead_settings table for Refugi Lead preferences
CREATE TABLE IF NOT EXISTS public.lead_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification Preferences
  audio_alerts_enabled BOOLEAN DEFAULT true,
  push_notifications_enabled BOOLEAN DEFAULT true,
  email_notifications_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TEXT DEFAULT '22:00',
  quiet_hours_end TEXT DEFAULT '08:00',
  
  -- Dashboard Preferences
  auto_refresh_interval INTEGER DEFAULT 30,
  show_kpis_section BOOLEAN DEFAULT true,
  show_reports_section BOOLEAN DEFAULT true,
  show_attention_queue BOOLEAN DEFAULT true,
  risk_threshold_medium INTEGER DEFAULT 40,
  risk_threshold_high INTEGER DEFAULT 70,
  default_report_format TEXT DEFAULT 'pdf',
  
  -- Team Preferences
  welcome_message_template TEXT DEFAULT 'Bienvenida al equipo Refugi. Estamos aquí para apoyarte.',
  
  -- Security
  two_factor_enabled BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.lead_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Refugi Leads can manage their own settings
CREATE POLICY "Refugi Leads can manage their own settings"
ON public.lead_settings
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_lead_settings_updated_at
BEFORE UPDATE ON public.lead_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_lead_settings_user_id ON public.lead_settings(user_id);

-- Add timezone to profiles if not exists
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/Madrid';