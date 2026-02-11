-- Migration: fix_credit_rls
-- 20260210_fix_credit_security.sql

-- 1. Alter functions to be SECURITY DEFINER so they can bypass RLS on credit_transactions
CREATE OR REPLACE FUNCTION reward_lead_generation()
RETURNS TRIGGER AS $$
BEGIN
    -- Only reward on INSERT (new lead)
    UPDATE public.profiles
    SET credit_balance = COALESCE(credit_balance, 0) + 1
    WHERE id = NEW.created_by;

    INSERT INTO public.credit_transactions (user_id, amount, type, description)
    VALUES (NEW.created_by, 1, 'lead_generation', 'Reward for generating a new lead');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reward_lead_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Only reward when status changes to 'completed'
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Reward the person who CLAIMED/COMPLETED the lead
        IF NEW.claimed_by IS NOT NULL THEN
            UPDATE public.profiles
            SET credit_balance = COALESCE(credit_balance, 0) + 5
            WHERE id = NEW.claimed_by;

            INSERT INTO public.credit_transactions (user_id, amount, type, description)
            VALUES (NEW.claimed_by, 5, 'lead_completion', 'Reward for completing a lead');
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION process_referral_reward(user_to_reward UUID)
RETURNS VOID AS $$
DECLARE
    referrer_id UUID;
    status TEXT;
    referrer_name TEXT;
    new_code TEXT;
BEGIN
    SELECT referred_by, referral_status INTO referrer_id, status FROM public.profiles WHERE id = user_to_reward;
    
    -- Only process if pending and referrer exists
    IF referrer_id IS NOT NULL AND status IN ('pending', 'none') THEN
        -- 1. Reward Referrer (+30)
        UPDATE public.profiles
        SET credit_balance = COALESCE(credit_balance, 0) + 30
        WHERE id = referrer_id;
        
        INSERT INTO public.credit_transactions (user_id, amount, type, description)
        VALUES (referrer_id, 30, 'referral_bonus_referrer', 'Referral bonus due to ' || user_to_reward);

        -- 2. Reward Referee (+20)
        UPDATE public.profiles
        SET credit_balance = COALESCE(credit_balance, 0) + 20, referral_status = 'rewarded'
        WHERE id = user_to_reward;

        INSERT INTO public.credit_transactions (user_id, amount, type, description)
        VALUES (user_to_reward, 20, 'referral_bonus_referee', 'Welcome bonus from referral');

        -- 3. REGENERATE Referrer's Code
        SELECT user_name INTO referrer_name FROM public.profiles WHERE id = referrer_id;
        
        new_code := UPPER(SUBSTRING(COALESCE(referrer_name, 'USER') FROM 1 FOR 4)) || FLOOR(1000 + RANDOM() * 8999)::TEXT;
        
        UPDATE public.profiles
        SET referral_code = new_code
        WHERE id = referrer_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Also ensure link_referral_on_signup is SECURITY DEFINER just to be safe (though profile insert usually fine)
CREATE OR REPLACE FUNCTION link_referral_on_signup()
RETURNS TRIGGER AS $$
DECLARE
    ref_code TEXT;
    referrer_id UUID;
BEGIN
    -- SECURITY DEFINER allows this function to bypass RLS when querying/updating ANY profile
    SELECT raw_user_meta_data->>'referral_code' INTO ref_code
    FROM auth.users
    WHERE id = NEW.id;

    IF ref_code IS NOT NULL AND ref_code != '' THEN
        SELECT id INTO referrer_id FROM public.profiles WHERE referral_code = ref_code;
        
        IF referrer_id IS NOT NULL AND referrer_id != NEW.id THEN
            NEW.referred_by := referrer_id;
            NEW.referral_status := 'pending';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
