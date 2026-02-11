-- Force fix for Leads Foreign Key and Schema
-- Run this in Supabase SQL Editor

-- 1. Ensure foreign key exists on leads.created_by
DO $$
BEGIN
    ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_created_by_fkey;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.leads
ADD CONSTRAINT leads_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES public.profiles(id);

-- 2. Ensure import_confidence column exists
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS import_confidence NUMERIC DEFAULT 0;

-- 3. Ensure app_settings table exists
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Insert default setting
INSERT INTO public.app_settings (key, value)
VALUES ('whatsapp_auto_approve', '{"enabled": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 5. Enable RLS on app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated access to app_settings"
ON public.app_settings FOR ALL
USING (auth.role() = 'authenticated');
