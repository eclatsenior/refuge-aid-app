-- Crear tabla para contraseñas de caja fuerte
CREATE TABLE IF NOT EXISTS public.vault_passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reset_requested_at TIMESTAMP WITH TIME ZONE,
  reset_approved_at TIMESTAMP WITH TIME ZONE,
  reset_approved_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.vault_passwords ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para vault_passwords
CREATE POLICY "Users can view their own vault password"
  ON public.vault_passwords FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vault password once"
  ON public.vault_passwords FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND NOT EXISTS (
      SELECT 1 FROM public.vault_passwords WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own vault password"
  ON public.vault_passwords FOR UPDATE
  USING (auth.uid() = user_id);

-- Crear tabla para solicitudes de reset de caja fuerte
CREATE TABLE IF NOT EXISTS public.vault_reset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('lead_approved', 'id_verification')),
  id_document_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.vault_reset_requests ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para vault_reset_requests
CREATE POLICY "Users can view their own reset requests"
  ON public.vault_reset_requests FOR SELECT
  USING (
    auth.uid() = user_id 
    OR auth.uid() IN (
      SELECT refugi_lead_id 
      FROM employee_assignments 
      WHERE employee_id = vault_reset_requests.user_id
    )
  );

CREATE POLICY "Users can create their own reset requests"
  ON public.vault_reset_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Refugi leads can update reset requests of their employees"
  ON public.vault_reset_requests FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT refugi_lead_id 
      FROM employee_assignments 
      WHERE employee_id = vault_reset_requests.user_id
    )
  );

-- Crear bucket para documentos de identidad
INSERT INTO storage.buckets (id, name, public)
VALUES ('vault-reset-ids', 'vault-reset-ids', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para vault-reset-ids
CREATE POLICY "Users can upload their ID documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'vault-reset-ids' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own ID documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'vault-reset-ids' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Refugi leads can view ID documents of their employees"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'vault-reset-ids'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT employee_id 
      FROM employee_assignments 
      WHERE refugi_lead_id = auth.uid()
    )
  );

-- Trigger para updated_at en vault_passwords
CREATE TRIGGER update_vault_passwords_updated_at
  BEFORE UPDATE ON public.vault_passwords
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para updated_at en vault_reset_requests
CREATE TRIGGER update_vault_reset_requests_updated_at
  BEFORE UPDATE ON public.vault_reset_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();