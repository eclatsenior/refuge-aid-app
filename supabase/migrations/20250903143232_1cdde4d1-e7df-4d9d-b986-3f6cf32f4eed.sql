-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('employee', 'refugi_lead');

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'employee',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create employee status tracking table
CREATE TABLE public.employee_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  mood_level INTEGER CHECK (mood_level >= 1 AND mood_level <= 10),
  therapy_progress INTEGER DEFAULT 0 CHECK (therapy_progress >= 0 AND therapy_progress <= 100),
  last_check_in TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_online BOOLEAN DEFAULT false,
  emergency_alert BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for employee_status
ALTER TABLE public.employee_status ENABLE ROW LEVEL SECURITY;

-- Policies for employee_status
CREATE POLICY "Employees can view and update their own status" 
ON public.employee_status 
FOR ALL 
USING (auth.uid() = employee_id);

CREATE POLICY "Refugi leads can view all employee status" 
ON public.employee_status 
FOR SELECT 
USING (public.get_current_user_role() = 'refugi_lead');

-- Create emergency alerts table
CREATE TABLE public.emergency_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL DEFAULT 'emergency',
  message TEXT,
  location_data JSONB,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES public.profiles(user_id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for emergency_alerts
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;

-- Policies for emergency_alerts
CREATE POLICY "Employees can create alerts" 
ON public.emergency_alerts 
FOR INSERT 
WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Refugi leads can view and manage all alerts" 
ON public.emergency_alerts 
FOR ALL 
USING (public.get_current_user_role() = 'refugi_lead');

CREATE POLICY "Employees can view their own alerts" 
ON public.emergency_alerts 
FOR SELECT 
USING (auth.uid() = employee_id);

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'employee')
  );
  
  -- Create initial employee status if role is employee
  IF COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'employee') = 'employee' THEN
    INSERT INTO public.employee_status (employee_id, mood_level, therapy_progress)
    VALUES (NEW.id, 7, 0);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_status_updated_at
  BEFORE UPDATE ON public.employee_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();