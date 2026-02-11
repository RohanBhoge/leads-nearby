-- Fix leads table: make customer_id nullable since we might not know the customer when creating a lead
-- The person generating the lead is different from the customer receiving the service

ALTER TABLE leads 
ALTER COLUMN customer_id DROP NOT NULL;

-- Add comment explaining the column purpose
COMMENT ON COLUMN leads.customer_id IS 'The customer who will receive the service (nullable since lead generator might not be the customer)';
