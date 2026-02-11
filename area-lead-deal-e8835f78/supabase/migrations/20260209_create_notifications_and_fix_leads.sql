-- Migration: Create Notifications Table and Fix Leads Schema
-- 20260209_create_notifications_and_fix_leads.sql

-- 1. Fix Leads Table
DO $$
BEGIN
    -- Add claimed_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'claimed_at') THEN
        ALTER TABLE public.leads ADD COLUMN claimed_at TIMESTAMPTZ;
    END IF;
END $$;

-- Add index for sorting by claimed_at (performance)
CREATE INDEX IF NOT EXISTS idx_leads_claimed_at ON public.leads(claimed_at);


-- 2. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL, -- 'new_lead', 'lead_accepted', etc.
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS for Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can select their own notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- Service role or functions can insert notifications (and technically users triggering functions)
-- For simplicity, allowing inserts if user_id matches (or could be open if using service key)
CREATE POLICY "Users can insert notifications for themselves" 
ON public.notifications FOR INSERT 
WITH CHECK (auth.uid() = user_id); 

-- Allow service role full access (implicitly true, but explicit for clarity if needed, mostly redundant)

-- 4. Create Push Tokens Table (if used in notifications.ts)
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  token TEXT NOT NULL,
  device_type TEXT DEFAULT 'web',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their push tokens" 
ON public.push_tokens FOR ALL 
USING (auth.uid() = user_id);
