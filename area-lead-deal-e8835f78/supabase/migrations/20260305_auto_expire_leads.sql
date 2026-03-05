-- Migration: auto_expire_leads
-- Auto-expires leads that have been claimed for more than 3 days without completion
-- Uses pg_cron to run every hour automatically (no user action needed)

-- Step 1: Ensure rejected_at column exists in leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

-- Step 2: Create the function to expire old leads
CREATE OR REPLACE FUNCTION expire_stale_leads()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER := 0;
    lead_record RECORD;
BEGIN
    -- Find claimed leads older than 3 days with no completion
    FOR lead_record IN
        SELECT id, claimed_by, created_by
        FROM public.leads
        WHERE status = 'claimed'
          AND claimed_at IS NOT NULL
          AND claimed_at < NOW() - INTERVAL '3 days'
          AND completed_at IS NULL
    LOOP
        -- Reset to open
        UPDATE public.leads
        SET status = 'open',
            claimed_by = NULL,
            claimed_at = NULL,
            rejected_at = NOW()
        WHERE id = lead_record.id;

        expired_count := expired_count + 1;
    END LOOP;

    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Enable pg_cron extension (if not already enabled)
-- NOTE: This requires pg_cron to be enabled in your Supabase project settings
-- Go to: Supabase Dashboard → Database → Extensions → Enable pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 4: Schedule the job to run every hour
-- Remove old job first if exists
SELECT cron.unschedule('expire-stale-leads') WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'expire-stale-leads'
);

SELECT cron.schedule(
    'expire-stale-leads',     -- Job name
    '0 * * * *',              -- Every hour at minute 0
    'SELECT expire_stale_leads();'
);
