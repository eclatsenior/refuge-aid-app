-- Create internal_messages table for secure communication between refugi_leads and employees
CREATE TABLE public.internal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Participants
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Content
  message TEXT NOT NULL,
  
  -- Context (optional links to alerts or cases)
  related_alert_id UUID REFERENCES emergency_alerts(id) ON DELETE SET NULL,
  related_case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent self-messaging
  CONSTRAINT internal_messages_sender_recipient_check 
    CHECK (sender_id != recipient_id),
    
  -- Limit message length
  CONSTRAINT internal_messages_length_check
    CHECK (char_length(message) > 0 AND char_length(message) <= 500)
);

-- Create indexes for fast queries
CREATE INDEX idx_internal_messages_recipient ON internal_messages(recipient_id, created_at DESC);
CREATE INDEX idx_internal_messages_sender ON internal_messages(sender_id, created_at DESC);
CREATE INDEX idx_internal_messages_conversation ON internal_messages(sender_id, recipient_id, created_at);
CREATE INDEX idx_internal_messages_unread ON internal_messages(recipient_id, is_read) WHERE is_read = FALSE;

-- Enable Row Level Security
ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own messages (sent or received)
CREATE POLICY "Users can view their own messages"
ON internal_messages FOR SELECT
USING (
  auth.uid() = sender_id OR auth.uid() = recipient_id
);

-- RLS Policy: Users can send messages only to assigned users
CREATE POLICY "Users can send messages to assigned users"
ON internal_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  (
    -- Refugi lead can message their assigned employees
    EXISTS (
      SELECT 1 FROM employee_assignments 
      WHERE refugi_lead_id = sender_id AND employee_id = recipient_id
    ) OR
    -- Employee can message their assigned refugi lead
    EXISTS (
      SELECT 1 FROM employee_assignments 
      WHERE employee_id = sender_id AND refugi_lead_id = recipient_id
    )
  )
);

-- RLS Policy: Users can mark received messages as read
CREATE POLICY "Users can mark received messages as read"
ON internal_messages FOR UPDATE
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_internal_messages_updated_at
BEFORE UPDATE ON internal_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for instant message delivery
ALTER PUBLICATION supabase_realtime ADD TABLE internal_messages;