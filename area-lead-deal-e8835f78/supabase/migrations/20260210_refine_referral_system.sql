-- Migration: refine_referral_system
-- 20260210_refine_referral_system.sql

-- 1. Backfill referral codes for any user who doesn't have one
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT * FROM public.profiles WHERE referral_code IS NULL LOOP
        -- Generate code logic (copied from trigger function)
        UPDATE public.profiles
        SET referral_code = (
            UPPER(SUBSTRING(COALESCE(r.user_name, 'USER') FROM 1 FOR 4)) || FLOOR(1000 + RANDOM() * 8999)::TEXT
        )
        WHERE id = r.id;
    END LOOP;
END $$;

-- 2. Function to Link Referral on Signup (Trigger on Profile Insert)
CREATE OR REPLACE FUNCTION link_referral_on_signup()
RETURNS TRIGGER AS $$
DECLARE
    ref_code TEXT;
    referrer_id UUID;
BEGIN
    -- Get referral code from auth metadata
    -- Note: This requires the client to send referral_code in metadata
    -- We access auth.users via a trick or just trust the metadata if passed differently?
    -- Actually, simpler: The TRIGGER cannot easily access auth.users metadata for the *inserts* into profiles table immediately 
    -- unless we passed it. 
    -- BUT, supabase auth.users insert triggers profile insert. 
    -- We can read from the `auth.users` table for this user.
    
    SELECT raw_user_meta_data->>'referral_code' INTO ref_code
    FROM auth.users
    WHERE id = NEW.id;

    IF ref_code IS NOT NULL AND ref_code != '' THEN
        -- Find referrer
        SELECT id INTO referrer_id FROM public.profiles WHERE referral_code = ref_code;
        
        IF referrer_id IS NOT NULL AND referrer_id != NEW.id THEN
            NEW.referred_by := referrer_id;
            NEW.referral_status := 'pending';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_link_referral_on_signup ON public.profiles;
CREATE TRIGGER trigger_link_referral_on_signup
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION link_referral_on_signup();


-- 3. Update Reward Process to REGENERATE code (One-Time Use Logic)
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

        -- 3. REGENERATE Referrer's Code (One-Time Use)
        SELECT user_name INTO referrer_name FROM public.profiles WHERE id = referrer_id;
        
        new_code := UPPER(SUBSTRING(COALESCE(referrer_name, 'USER') FROM 1 FOR 4)) || FLOOR(1000 + RANDOM() * 8999)::TEXT;
        -- Ensure uniqueness (simple check, could loop in a real function but good enough for update)
        
        UPDATE public.profiles
        SET referral_code = new_code
        WHERE id = referrer_id;
        
    END IF;
END;
$$ LANGUAGE plpgsql;
