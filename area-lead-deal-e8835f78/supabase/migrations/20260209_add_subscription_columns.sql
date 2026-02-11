-- Add subscription fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_subscribed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Update RLS to allow users to read their own subscription status (already covered by select policy, but ensuring update)
-- The Edge Function uses service_role so it bypasses RLS for updates.