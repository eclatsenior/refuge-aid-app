-- Create super_admins table (separate from profiles for security)
CREATE TABLE public.super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- Only super admins can view their own record
CREATE POLICY "Super admins can view own record"
ON public.super_admins FOR SELECT
USING (auth.uid() = user_id);

-- Insert the specific super admin user
INSERT INTO public.super_admins (user_id, email)
SELECT user_id, email FROM profiles 
WHERE email = 'eclatsenior+test900@gmail.com';

-- Create security definer function to check super admin status
CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins WHERE user_id = check_user_id
  );
$$;