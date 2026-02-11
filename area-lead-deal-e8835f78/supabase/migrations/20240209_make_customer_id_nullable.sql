-- Make customer_id nullable to support leads created via name/phone
ALTER TABLE public.leads ALTER COLUMN customer_id DROP NOT NULL;
