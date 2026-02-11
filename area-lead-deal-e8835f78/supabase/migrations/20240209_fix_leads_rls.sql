-- Fix enum status
-- Postgres doesn't support IF NOT EXISTS for enum values directly in all versions, 
-- so running this might fail if it already exists, but it's safe to run.
-- If it fails, just ignore and proceed to RLS.
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'claimed';

-- Enable RLS on leads table
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow users to create leads
DROP POLICY IF EXISTS "Users can create leads" ON public.leads;
CREATE POLICY "Users can create leads"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Allow users to view leads
DROP POLICY IF EXISTS "Users can view all leads" ON public.leads;
CREATE POLICY "Users can view all leads"
ON public.leads
FOR SELECT
TO authenticated
USING (true);

-- Allow updates (for claiming and creators)
DROP POLICY IF EXISTS "Authenticated users can update leads" ON public.leads;
CREATE POLICY "Authenticated users can update leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (true);
