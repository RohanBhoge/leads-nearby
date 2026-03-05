-- ==============================================================================
-- SYSTEM DESIGN UPGRADE: POSTGIS & DATABASE INDEXING
-- This script upgrades the `leads` table to use PostGIS for spatial queries.
-- It moves the "radius distance calculation" from the frontend (React JS)
-- into the backend (Supabase PostgreSQL), saving bandwidth and processing power.
-- ==============================================================================

-- 1. Enable the PostGIS extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Add a specialized PostGIS Geography column to the `leads` table
-- This allows for mathematically accurate distance calculations over the Earth's surface
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS location_point geography(Point, 4326);

-- 3. Populate existing rows: convert lat/long into the geography point
-- PostGIS expects longitude first, then latitude! (ST_MakePoint(lon, lat))
UPDATE public.leads 
SET location_point = ST_SetSRID(ST_MakePoint(location_long, location_lat), 4326)::geography 
WHERE location_lat IS NOT NULL AND location_long IS NOT NULL;

-- 4. Create an automatic trigger to keep location_point updated 
-- Whenever a new lead is inserted (or lat/long is updated), update the point
CREATE OR REPLACE FUNCTION update_location_point()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.location_lat IS NOT NULL AND NEW.location_long IS NOT NULL THEN
    NEW.location_point = ST_SetSRID(ST_MakePoint(NEW.location_long, NEW.location_lat), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_location_point ON public.leads;
CREATE TRIGGER trg_update_location_point
BEFORE INSERT OR UPDATE OF location_lat, location_long
ON public.leads
FOR EACH ROW
EXECUTE FUNCTION update_location_point();

-- ==============================================================================
-- DATABASE INDEXES (Performance Upgrades)
-- ==============================================================================

-- 5. Create a Spatial Index (GIST) on the location_point column
-- This makes searching for "leads near me" lightning fast, even with 1M rows.
CREATE INDEX IF NOT EXISTS idx_leads_location_point ON public.leads USING GIST (location_point);

-- 6. Create B-Tree indexes for frequently filtered columns
-- Filtering by status (e.g., finding only 'open' leads)
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads (status);

-- Sorting by newest leads first
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads (created_at DESC);

-- ==============================================================================
-- THE SYSTEM DESIGN UPGRADE (The RPC Function)
-- ==============================================================================

-- 7. Create an RPC (Remote Procedure Call) function so the React frontend 
-- can ask Supabase: "Give me active leads within X km of my location."
CREATE OR REPLACE FUNCTION get_nearby_leads(
  p_lat DOUBLE PRECISION,
  p_long DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION,
  p_search_text TEXT DEFAULT NULL,
  p_category_id UUID DEFAULT NULL,
  p_sub_category_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  amount NUMERIC,
  status TEXT,
  created_at TIMESTAMPTZ,
  created_by UUID,
  location_lat DOUBLE PRECISION,
  location_long DOUBLE PRECISION,
  location_address TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  images TEXT[],
  category_name TEXT,     -- Joined category name
  sub_category_name TEXT, -- Joined subcategory name
  distance_km DOUBLE PRECISION -- Calculated distance returned to frontend
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.title,
    l.description,
    l.amount,
    l.status,
    l.created_at,
    l.created_by,
    l.location_lat,
    l.location_long,
    l.location_address,
    l.customer_name,
    l.customer_phone,
    l.images,
    c.name AS category_name,
    sc.name AS sub_category_name,
    -- Calculate distance in meters, divide by 1000 for km
    ST_Distance(l.location_point, ST_SetSRID(ST_MakePoint(p_long, p_lat), 4326)::geography) / 1000.0 AS distance_km
  FROM 
    public.leads l
  LEFT JOIN 
    public.categories c ON l.category_id = c.id
  LEFT JOIN 
    public.sub_categories sc ON l.sub_category_id = sc.id
  WHERE 
    l.status = 'open'
    -- Spatial Search: ST_DWithin uses the GIST index instantly
    AND ST_DWithin(l.location_point, ST_SetSRID(ST_MakePoint(p_long, p_lat), 4326)::geography, p_radius_km * 1000)
    -- Optional text search across multiple columns
    AND (
      p_search_text IS NULL OR 
      p_search_text = '' OR 
      l.title ILIKE '%' || p_search_text || '%' OR 
      l.description ILIKE '%' || p_search_text || '%' OR 
      l.location_address ILIKE '%' || p_search_text || '%'
    )
    -- Optional Category Filter
    AND (p_category_id IS NULL OR l.category_id = p_category_id)
    -- Optional Subcategory Filter
    AND (p_sub_category_id IS NULL OR l.sub_category_id = p_sub_category_id)
  ORDER BY 
    distance_km ASC; -- Return closest leads first
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
