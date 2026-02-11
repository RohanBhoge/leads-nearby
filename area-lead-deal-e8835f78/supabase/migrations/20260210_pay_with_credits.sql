-- Migration: pay_with_credits
-- 20260210_pay_with_credits.sql

-- 1. Function to Purchase Subscription FULLY with Credits
CREATE OR REPLACE FUNCTION purchase_subscription_via_credits(
    p_user_id UUID,
    p_cost INTEGER, -- In Credits (e.g. 499)
    p_duration_days INTEGER DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
    current_balance INTEGER;
    new_expiry TIMESTAMPTZ;
BEGIN
    -- Check Balance
    SELECT credit_balance INTO current_balance FROM public.profiles WHERE id = p_user_id;
    
    IF current_balance IS NULL OR current_balance < p_cost THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits');
    END IF;

    -- Deduct Credits
    UPDATE public.profiles
    SET credit_balance = credit_balance - p_cost
    WHERE id = p_user_id;

    -- Log Transaction
    INSERT INTO public.credit_transactions (user_id, amount, type, description)
    VALUES (p_user_id, -p_cost, 'subscription_purchase', 'Paid subscription via credits');

    -- Update Subscription
    -- Calculate new expiry: If already active, add to existing. Else, start from now.
    SELECT 
        CASE 
            WHEN subscription_expires_at > NOW() THEN subscription_expires_at + (p_duration_days || ' days')::INTERVAL
            ELSE NOW() + (p_duration_days || ' days')::INTERVAL
        END
    INTO new_expiry
    FROM public.profiles WHERE id = p_user_id;

    UPDATE public.profiles
    SET 
        is_subscribed = true,
        subscription_expires_at = new_expiry
    WHERE id = p_user_id;

    RETURN jsonb_build_object('success', true, 'new_balance', current_balance - p_cost, 'expires_at', new_expiry);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Function to Complete PARTIAL Payment (Called after Razorpay success)
CREATE OR REPLACE FUNCTION complete_partial_payment(
    p_user_id UUID,
    p_credits_deducted INTEGER,
    p_payment_amount INTEGER, -- In Rupees
    p_payment_id TEXT,
    p_order_id TEXT
)
RETURNS JSONB AS $$
DECLARE
    new_expiry TIMESTAMPTZ;
BEGIN
    -- Deduct Credits (We assume verification happened before calling this, or this is called by a verified edge function)
    -- But strict check: Make sure they still have the credits
    IF p_credits_deducted > 0 THEN
         UPDATE public.profiles
         SET credit_balance = credit_balance - p_credits_deducted
         WHERE id = p_user_id AND credit_balance >= p_credits_deducted;
         
         IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits for partial deduction');
         END IF;

         INSERT INTO public.credit_transactions (user_id, amount, type, description)
         VALUES (p_user_id, -p_credits_deducted, 'subscription_purchase', 'Partial payment via credits (Balance paid via Razorpay: ' || p_payment_amount || ')');
    END IF;

    -- Update Subscription
    SELECT 
        CASE 
            WHEN subscription_expires_at > NOW() THEN subscription_expires_at + INTERVAL '30 days'
            ELSE NOW() + INTERVAL '30 days'
        END
    INTO new_expiry
    FROM public.profiles WHERE id = p_user_id;

    UPDATE public.profiles
    SET 
        is_subscribed = true,
        subscription_expires_at = new_expiry
    WHERE id = p_user_id;
    
    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
