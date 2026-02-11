-- 1. Fix Foreign Key for leads -> created_by (profiles)
DO $$
BEGIN
    -- Try to drop the constraint if it exists with a different name or to ensure we recreate it correctly
    -- We'll try to drop the standard expected name first
    BEGIN
        ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_created_by_fkey;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- Re-add the foreign key specificially named "leads_created_by_fkey"
    -- This ensures the frontend code `profiles!leads_created_by_fkey` works
    ALTER TABLE public.leads
    ADD CONSTRAINT leads_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES public.profiles(id);
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error fixing foreign key: %', SQLERRM;
END $$;


-- 2. Add missing import_confidence column to leads
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'import_confidence') THEN
        ALTER TABLE public.leads ADD COLUMN import_confidence NUMERIC DEFAULT 0;
    END IF;
END $$;


-- 3. Create app_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default auto-approve setting if missing
INSERT INTO public.app_settings (key, value)
VALUES ('whatsapp_auto_approve', '{"enabled": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Enable RLS on app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow admins to read/write settings (simple policy for now, adjust as needed)
CREATE POLICY "Allow authenticated access to app_settings"
ON public.app_settings FOR ALL
USING (auth.role() = 'authenticated');
