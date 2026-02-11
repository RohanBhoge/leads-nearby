-- Migration: Fix Auth Trigger with Safer Location Casting
-- 20260209_fix_auth_trigger_location_casting.sql

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  meta_role user_role;
  meta_cat_id UUID;
  meta_sub_cat_id UUID;
  meta_lat FLOAT;
  meta_long FLOAT;
  meta_radius INT;
BEGIN
  -- Safe casting for Role
  BEGIN
    meta_role := (NEW.raw_user_meta_data ->> 'role')::user_role;
  EXCEPTION WHEN OTHERS THEN
    meta_role := 'user';
  END;

  -- Safe casting for UUIDs
  BEGIN
    meta_cat_id := NULLIF(NEW.raw_user_meta_data ->> 'category_id', '')::uuid;
  EXCEPTION WHEN OTHERS THEN
    meta_cat_id := NULL;
  END;

  BEGIN
    meta_sub_cat_id := NULLIF(NEW.raw_user_meta_data ->> 'sub_category_id', '')::uuid;
  EXCEPTION WHEN OTHERS THEN
    meta_sub_cat_id := NULL;
  END;

  -- Safe casting for Location with explicit NULL checks
  BEGIN
    IF (NEW.raw_user_meta_data ->> 'location_lat') IS NULL OR (NEW.raw_user_meta_data ->> 'location_lat') = '' THEN
      meta_lat := NULL;
    ELSE
      meta_lat := (NEW.raw_user_meta_data ->> 'location_lat')::float;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    meta_lat := NULL;
  END;

  BEGIN
    IF (NEW.raw_user_meta_data ->> 'location_long') IS NULL OR (NEW.raw_user_meta_data ->> 'location_long') = '' THEN
      meta_long := NULL;
    ELSE
      meta_long := (NEW.raw_user_meta_data ->> 'location_long')::float;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    meta_long := NULL;
  END;

  BEGIN
     IF (NEW.raw_user_meta_data ->> 'service_radius_km') IS NULL OR (NEW.raw_user_meta_data ->> 'service_radius_km') = '' THEN
       meta_radius := 50;
     ELSE
       meta_radius := (NEW.raw_user_meta_data ->> 'service_radius_km')::int;
     END IF;
  EXCEPTION WHEN OTHERS THEN
    meta_radius := 50;
  END;

  INSERT INTO public.profiles (
    id, 
    user_name, 
    phone, 
    role, 
    category_id, 
    sub_category_id,
    email,
    location_lat,
    location_long,
    service_radius_km
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', NEW.phone, ''),
    COALESCE(meta_role, 'user'),
    meta_cat_id,
    meta_sub_cat_id,
    NEW.email,
    meta_lat,
    meta_long,
    meta_radius
  );

  RETURN NEW;
END;
$$;
