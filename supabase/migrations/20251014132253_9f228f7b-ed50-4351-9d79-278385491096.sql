-- Add phone column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN phone TEXT;

COMMENT ON COLUMN public.profiles.phone IS 'Employee phone number for emergency contact';
