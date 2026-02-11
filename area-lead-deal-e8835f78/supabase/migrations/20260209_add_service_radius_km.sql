-- Migration: Add service_radius_km to profiles
-- 20260209_add_service_radius_km.sql

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'service_radius_km') THEN
        ALTER TABLE public.profiles ADD COLUMN service_radius_km INTEGER DEFAULT 50;
    END IF;
END $$;
