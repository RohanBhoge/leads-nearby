-- Add created_by column to track who posted/created the lead
-- This is different from customer_id (who receives the service)

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_leads_created_by ON leads(created_by);

-- Add comment
COMMENT ON COLUMN leads.created_by IS 'User who created/posted this lead (the lead generator)';

-- Add claimed_at timestamp if it doesn't exist
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

COMMENT ON COLUMN leads.claimed_at IS 'Timestamp when the lead was claimed/accepted';
