-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending', -- pending, completed, failed
  payment_gateway TEXT, -- razorpay, coupon
  gateway_order_id TEXT,
  gateway_transaction_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own payments
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments"
ON public.payments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow service role (Edge Functions) to insert/update payments
-- (Service role bypasses RLS, but we can add policies for completeness if needed)
-- For now, explicit policies for insert/update are not needed for client-side usage 
-- as payments are created via Edge Functions (service role).

-- Allow users to insert (optional, but usually handled by backend)
-- We'll restrict insert/update to service role mostly, but if client creates entries (unlikely for secure flows):
-- No client-side insert policy for now to ensure integrity.
