-- Migration: fix_referral_logic
-- 20260210_fix_referral_logic.sql

-- 1. Ensure is_subscribed column exists (just in case)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_subscribed BOOLEAN DEFAULT false;

-- 2. Update Linking Trigger to be Case-Insensitive
CREATE OR REPLACE FUNCTION link_referral_on_signup()
RETURNS TRIGGER AS $$
DECLARE
    ref_code TEXT;
    referrer_id UUID;
BEGIN
    -- Get referral code from metadata and Normalize (UPPER + TRIM)
    SELECT UPPER(TRIM(raw_user_meta_data->>'referral_code')) INTO ref_code
    FROM auth.users
    WHERE id = NEW.id;

    IF ref_code IS NOT NULL AND ref_code != '' THEN
        -- Find referrer (exact match on normalized code)
        SELECT id INTO referrer_id FROM public.profiles WHERE referral_code = ref_code;
        
        IF referrer_id IS NOT NULL AND referrer_id != NEW.id THEN
            NEW.referred_by := referrer_id;
            NEW.referral_status := 'pending';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Automate Reward on Subscription
-- Create trigger to call process_referral_reward when is_subscribed becomes TRUE
CREATE OR REPLACE FUNCTION trigger_check_referral_reward()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user Just Subscribed (False/Null -> True)
    IF (NEW.is_subscribed = true AND (OLD.is_subscribed IS NULL OR OLD.is_subscribed = false)) THEN
        -- Call the reward function
        PERFORM process_referral_reward(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_subscription_reward ON public.profiles;
CREATE TRIGGER check_subscription_reward
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION trigger_check_referral_reward();
