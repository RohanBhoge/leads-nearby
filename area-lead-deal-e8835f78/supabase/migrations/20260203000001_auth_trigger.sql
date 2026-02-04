-- Migration: Update Auth Trigger to support Category/Role
-- 20260203000001_auth_trigger.sql

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  meta_role user_role;
  meta_cat_id UUID;
  meta_sub_cat_id UUID;
BEGIN
  -- Safe casting for Role
  BEGIN
    meta_role := (NEW.raw_user_meta_data ->> 'role')::user_role;
  EXCEPTION WHEN OTHERS THEN
    meta_role := 'user'; -- Default to user if invalid
  END;

  -- Safe casting for UUIDs (Handle empty strings or nulls)
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

  INSERT INTO public.profiles (
    id, 
    user_name, 
    phone, 
    role, 
    category_id, 
    sub_category_id,
    email -- It's good practice to store email in profile too
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', NEW.phone, ''),
    COALESCE(meta_role, 'user'),
    meta_cat_id,
    meta_sub_cat_id,
    NEW.email
  );
  
  RETURN NEW;
END;
$$;