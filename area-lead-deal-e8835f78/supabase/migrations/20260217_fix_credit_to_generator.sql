-- Migration: fix_credit_to_generator
-- 20260217_fix_credit_to_generator.sql

-- ============================================
-- STEP 1: DROP the old trigger that awards credits to the WRONG person (claimed_by/completer)
-- ============================================
DROP TRIGGER IF EXISTS trigger_reward_lead_completion ON public.leads;
DROP FUNCTION IF EXISTS reward_lead_completion() CASCADE;

-- ============================================
-- STEP 2: Create a new RPC function that the frontend can call
-- This uses SECURITY DEFINER to bypass RLS so any user can award credits to the generator
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
    -- Get the generator's current credit balance
    SELECT COALESCE(credit_balance, 0) INTO current_bal
    FROM public.profiles
    WHERE id = generator_id;

    -- Calculate new balance
    new_bal := current_bal + 5;

    -- Update the generator's credit balance
    UPDATE public.profiles
    SET credit_balance = new_bal
    WHERE id = generator_id;

    -- Log the transaction
    INSERT INTO public.credit_transactions (user_id, amount, type, description)
    VALUES (generator_id, 5, 'lead_completion', 'Reward for your generated lead being completed (Lead: ' || lead_id::TEXT || ')');

    RETURN jsonb_build_object(
        'success', true,
        'previous_balance', current_bal,
        'new_balance', new_bal,
        'credits_awarded', 5
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;