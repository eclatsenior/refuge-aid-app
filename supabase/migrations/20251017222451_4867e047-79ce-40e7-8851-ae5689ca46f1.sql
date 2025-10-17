-- Create SECURITY DEFINER function to check if users can communicate
-- This bypasses RLS on employee_assignments to prevent recursive RLS issues
CREATE OR REPLACE FUNCTION public.can_send_message(
  sender_id_param UUID,
  recipient_id_param UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    -- Refugi lead can message their assigned employees
    SELECT 1 FROM employee_assignments 
    WHERE refugi_lead_id = sender_id_param 
      AND employee_id = recipient_id_param
  ) OR EXISTS (
    -- Employee can message their assigned refugi lead
    SELECT 1 FROM employee_assignments 
    WHERE employee_id = sender_id_param 
      AND refugi_lead_id = recipient_id_param
  );
END;
$$;

-- Drop old policy
DROP POLICY IF EXISTS "Users can send messages to assigned users" ON internal_messages;

-- Create new policy using SECURITY DEFINER function
CREATE POLICY "Users can send messages to assigned users"
ON internal_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id 
  AND public.can_send_message(sender_id, recipient_id)
);