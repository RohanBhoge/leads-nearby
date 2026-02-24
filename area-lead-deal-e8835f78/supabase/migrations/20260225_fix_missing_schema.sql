-- =============================================
-- Fix missing schema pieces
-- 1. rejected_at column on leads
-- 2. ratings table
-- 3. Reload schema cache
-- =============================================

-- Add rejected_at column to leads if not exists
ALTER TABLE leads ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

-- Create ratings table if not exists
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  rater_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  rated_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view ratings" ON ratings;
DROP POLICY IF EXISTS "Users can insert ratings" ON ratings;

CREATE POLICY "Anyone can view ratings" ON ratings
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert ratings" ON ratings
  FOR INSERT WITH CHECK (rater_id = auth.uid());

-- Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
