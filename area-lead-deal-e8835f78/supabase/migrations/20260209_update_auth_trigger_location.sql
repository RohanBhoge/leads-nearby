-- Migration: Update Auth Trigger to support Location Data
-- 20260209_update_auth_trigger_location.sql

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
    meta_role := 'user'; -- Default to user if invalid
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

  -- Safe casting for Location
  BEGIN
    meta_lat := (NEW.raw_user_meta_data ->> 'location_lat')::float;
    meta_long := (NEW.raw_user_meta_data ->> 'location_long')::float;
    meta_radius := COALESCE((NEW.raw_user_meta_data ->> 'service_radius_km')::int, 50);
  EXCEPTION WHEN OTHERS THEN
    meta_lat := NULL;
    meta_long := NULL;
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
