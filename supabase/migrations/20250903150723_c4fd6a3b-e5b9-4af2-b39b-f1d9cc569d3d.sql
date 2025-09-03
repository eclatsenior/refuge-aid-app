-- Create employee assignments table to link refugi_leads with employees
CREATE TABLE public.employee_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  refugi_lead_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(refugi_lead_id, employee_id)
);

-- Enable Row Level Security
ALTER TABLE public.employee_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for employee assignments
CREATE POLICY "Refugi leads can view their assignments" 
ON public.employee_assignments 
FOR SELECT 
USING (auth.uid() = refugi_lead_id);

CREATE POLICY "Refugi leads can manage their assignments" 
ON public.employee_assignments 
FOR ALL 
USING (auth.uid() = refugi_lead_id);

-- Add trigger for updated_at
CREATE TRIGGER update_employee_assignments_updated_at
BEFORE UPDATE ON public.employee_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert assignment: Assign Fausto to Lucía (using the first Lucía user)
INSERT INTO public.employee_assignments (refugi_lead_id, employee_id)
VALUES (
  '2eb884c2-42bb-4a6e-aead-10700313ed7e', -- Lucía (refugi_lead)
  '32296943-feb4-45f8-9082-761813a0b7ac'  -- Fausto (employee)
);