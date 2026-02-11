-- Clean up orphan leads and apply fixes
-- Result of error: insert or update on table "leads" violates foreign key constraint "leads_created_by_fkey"

-- 1. Delete leads where created_by does not exist in profiles
-- This is necessary to add the Foreign Key constraint
DELETE FROM public.leads
WHERE created_by NOT IN (SELECT id FROM public.profiles);

-- 2. Now retrying the Foreign Key application
DO $$
BEGIN
    ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_created_by_fkey;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.leads
ADD CONSTRAINT leads_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES public.profiles(id);

-- 3. Ensure import_confidence column exists (Retrying just in case)
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS import_confidence NUMERIC DEFAULT 0;

-- 4. Ensure app_settings table exists (Retrying just in case)
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Insert default setting
INSERT INTO public.app_settings (key, value)
VALUES ('whatsapp_auto_approve', '{"enabled": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 6. Enable RLS on app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated access to app_settings" ON public.app_settings;
CREATE POLICY "Allow authenticated access to app_settings"
ON public.app_settings FOR ALL
USING (auth.role() = 'authenticated');
