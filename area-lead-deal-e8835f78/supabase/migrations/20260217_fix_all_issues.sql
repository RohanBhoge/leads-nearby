-- Migration: fix_all_database_issues
-- 20260217_fix_all_issues.sql
-- Fixes: missing ratings table, profiles.name column, notifications RLS, and credit trigger

-- ============================================
-- 1. DROP the old credit trigger (awards to WRONG person)
-- ============================================
DROP TRIGGER IF EXISTS trigger_reward_lead_completion ON public.leads;
DROP FUNCTION IF EXISTS reward_lead_completion() CASCADE;

-- ============================================
-- 2. Create the RPC function for awarding credits to lead GENERATOR
-- ============================================
CREATE OR REPLACE FUNCTION award_lead_completion_credits(
    generator_id UUID,
    lead_id UUID
)
RETURNS JSONB AS $$
DECLARE
    current_bal INTEGER;
    new_bal INTEGER;
BEGIN
    SELECT COALESCE(credit_balance, 0) INTO current_bal
    FROM public.profiles WHERE id = generator_id;

    new_bal := current_bal + 5;

    UPDATE public.profiles
    SET credit_balance = new_bal
    WHERE id = generator_id;

    INSERT INTO public.credit_transactions (user_id, amount, type, description)
    VALUES (generator_id, 5, 'lead_completion', 'Reward for your generated lead being completed');

    RETURN jsonb_build_object('success', true, 'previous_balance', current_bal, 'new_balance', new_bal);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. Add 'name' column to profiles if missing (code uses select('name'))
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'name'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN name TEXT;
        -- Copy user_name to name for existing rows
        UPDATE public.profiles SET name = user_name WHERE name IS NULL AND user_name IS NOT NULL;
    END IF;
END $$;

-- ============================================
-- 4. Create ratings table if it doesn't exist
-- ============================================
CREATE TABLE IF NOT EXISTS public.ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    rater_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rated_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(lead_id, rater_id)
);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Users can view all ratings
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.ratings;
CREATE POLICY "Anyone can view ratings" ON public.ratings
    FOR SELECT USING (true);

-- Users can create ratings (as the rater)
DROP POLICY IF EXISTS "Users can create ratings" ON public.ratings;
CREATE POLICY "Users can create ratings" ON public.ratings
    FOR INSERT WITH CHECK (auth.uid() = rater_id);

-- Users can update their own ratings
DROP POLICY IF EXISTS "Users can update own ratings" ON public.ratings;
CREATE POLICY "Users can update own ratings" ON public.ratings
    FOR UPDATE USING (auth.uid() = rater_id);

-- ============================================
-- 5. Fix notifications RLS - allow authenticated users to insert notifications
-- ============================================
DROP POLICY IF EXISTS "Users can create notifications" ON public.notifications;
CREATE POLICY "Users can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
CREATE POLICY "Authenticated users can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);