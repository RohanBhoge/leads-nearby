-- Fix RLS policy for leads insertion
-- Old policy: Users can only insert if they are the customer (customer_id = auth.uid())
-- New policy: Any authenticated user can create a lead (customer_id can be null)

DROP POLICY IF EXISTS "Users can insert leads" ON leads;

CREATE POLICY "Authenticated users can create leads" 
  ON leads 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);
