-- Migration: implement_credit_referral_system
-- 20260210_credit_referral_system.sql

-- 1. Update Profiles Table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS credit_balance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS referral_status TEXT DEFAULT 'none'; -- 'none', 'pending', 'rewarded'

-- 2. Create Credit Transactions Table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    amount INTEGER NOT NULL, -- Positive for earn, negative for spend
    type TEXT NOT NULL, -- 'lead_generation', 'lead_completion', 'referral_bonus_referrer', 'referral_bonus_referee', 'subscription_purchase'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Transactions
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
ON public.credit_transactions FOR SELECT
USING (auth.uid() = user_id);

-- 3. Function to Generate Unique Referral Code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
DECLARE
    new_code TEXT;
    base_name TEXT;
BEGIN
    -- Try to generate code from name, fallback to random
    IF NEW.user_name IS NOT NULL THEN
        base_name := UPPER(SUBSTRING(NEW.user_name FROM 1 FOR 4));
    ELSE
        base_name := 'USER';
    END IF;
    
    -- Loop until unique code found
    LOOP
        new_code := base_name || FLOOR(1000 + RANDOM() * 8999)::TEXT;
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_code) THEN
            NEW.referral_code := new_code;
            EXIT;
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate referral code on profile creation
DROP TRIGGER IF EXISTS trigger_generate_referral_code ON public.profiles;
CREATE TRIGGER trigger_generate_referral_code
BEFORE INSERT ON public.profiles
FOR EACH ROW
WHEN (NEW.referral_code IS NULL)
EXECUTE FUNCTION generate_referral_code();


-- 4. Function: Reward for Lead Generation (+1 Credit)
CREATE OR REPLACE FUNCTION reward_lead_generation()
RETURNS TRIGGER AS $$
BEGIN
    -- Only reward on INSERT (new lead)
    UPDATE public.profiles
    SET credit_balance = credit_balance + 1
    WHERE id = NEW.created_by;

    INSERT INTO public.credit_transactions (user_id, amount, type, description)
    VALUES (NEW.created_by, 1, 'lead_generation', 'Reward for generating a new lead');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reward_lead_generation ON public.leads;
CREATE TRIGGER trigger_reward_lead_generation
AFTER INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION reward_lead_generation();


-- 5. Function: Reward for Lead Completion (+5 Credits)
CREATE OR REPLACE FUNCTION reward_lead_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Only reward when status changes to 'completed'
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Reward the person who CLAIMED/COMPLETED the lead
        IF NEW.claimed_by IS NOT NULL THEN
            UPDATE public.profiles
            SET credit_balance = credit_balance + 5
            WHERE id = NEW.claimed_by;

            INSERT INTO public.credit_transactions (user_id, amount, type, description)
            VALUES (NEW.claimed_by, 5, 'lead_completion', 'Reward for completing a lead');
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reward_lead_completion ON public.leads;
CREATE TRIGGER trigger_reward_lead_completion
AFTER UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION reward_lead_completion();


-- 6. Helper Function: Check & Apply Referral Bonus (Called manually or via subscription webhook later)
-- For now, let's create a function that CAN be called.
CREATE OR REPLACE FUNCTION process_referral_reward(user_to_reward UUID)
RETURNS VOID AS $$
DECLARE
    referrer_id UUID;
    status TEXT;
BEGIN
    SELECT referred_by, referral_status INTO referrer_id, status FROM public.profiles WHERE id = user_to_reward;
    
    -- Only process if pending and referrer exists
    IF referrer_id IS NOT NULL AND status IN ('pending', 'none') THEN
        -- 1. Reward Referrer (+30)
        UPDATE public.profiles
        SET credit_balance = credit_balance + 30
        WHERE id = referrer_id;
        
        INSERT INTO public.credit_transactions (user_id, amount, type, description)
        VALUES (referrer_id, 30, 'referral_bonus_referrer', 'Referral bonus due to ' || user_to_reward);

        -- 2. Reward Referee (+20)
        UPDATE public.profiles
        SET credit_balance = credit_balance + 20, referral_status = 'rewarded'
        WHERE id = user_to_reward;

        INSERT INTO public.credit_transactions (user_id, amount, type, description)
        VALUES (user_to_reward, 20, 'referral_bonus_referee', 'Welcome bonus from referral');
    END IF;
END;
$$ LANGUAGE plpgsql;
