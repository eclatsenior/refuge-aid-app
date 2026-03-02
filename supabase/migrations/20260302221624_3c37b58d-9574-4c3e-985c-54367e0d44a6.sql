-- Add 'completed' status to allowed values
ALTER TABLE vault_reset_requests DROP CONSTRAINT vault_reset_requests_status_check;
ALTER TABLE vault_reset_requests ADD CONSTRAINT vault_reset_requests_status_check 
  CHECK (status = ANY (ARRAY['pending', 'approved', 'rejected', 'completed']));

-- Mark all old approved requests as completed (tokens already expired)
UPDATE vault_reset_requests 
SET status = 'completed', updated_at = now() 
WHERE status = 'approved';