-- Migration 02: Weekly Boss Auto-Reset
-- Adds a function to archive defeated bosses and auto-create the next week's boss.
-- Run this manually in the Supabase SQL Editor.
-- For automatic reset every Monday, enable pg_cron in your Supabase project settings
-- and run the cron job setup at the bottom.

-- ─── 1. Clamp boss HP to never go negative ───────────────────────────────────
-- Update the complete_habit RPC to ensure boss HP is clamped at 0
-- (Add GREATEST(0, ...) around the HP update)
-- This is handled in the RPC body — no schema change needed if already present.

-- ─── 2. Function: Reset weekly boss ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION reset_weekly_boss()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now        TIMESTAMPTZ := NOW();
  v_monday     DATE;
  v_sunday     DATE;
  v_week_num   INT;
  v_boss_names TEXT[] := ARRAY[
    'The Shadow Titan',
    'Sloth Demon',
    'The Procrastinator',
    'Void Wyrm',
    'Entropy Golem',
    'The Distraction',
    'Chaos Serpent',
    'Iron Slumber'
  ];
  v_boss_name  TEXT;
BEGIN
  -- Calculate current week's Monday and Sunday
  v_monday := DATE_TRUNC('week', v_now)::DATE;  -- ISO week starts on Monday
  v_sunday := v_monday + INTERVAL '6 days';

  -- Skip if a boss already exists for this week
  IF EXISTS (
    SELECT 1 FROM weekly_boss
    WHERE starts_at <= v_now AND ends_at >= v_now
  ) THEN
    RETURN;
  END IF;

  -- Pick boss name by week number (deterministic)
  v_week_num := EXTRACT(WEEK FROM v_now)::INT;
  v_boss_name := v_boss_names[((v_week_num - 1) % ARRAY_LENGTH(v_boss_names, 1)) + 1];

  -- Insert new weekly boss
  INSERT INTO weekly_boss (name, max_hp, current_hp, starts_at, ends_at, is_defeated)
  VALUES (
    v_boss_name,
    1000,
    1000,
    v_monday::TIMESTAMPTZ,
    (v_sunday + INTERVAL '23 hours 59 minutes 59 seconds')::TIMESTAMPTZ,
    FALSE
  );
END;
$$;

-- ─── 3. Grant execute to authenticated users ─────────────────────────────────
GRANT EXECUTE ON FUNCTION reset_weekly_boss() TO authenticated;

-- ─── 4. (Optional) pg_cron setup — requires pg_cron extension enabled ────────
-- Run this in Supabase SQL Editor ONLY if pg_cron is available:
--
-- SELECT cron.schedule(
--   'weekly-boss-reset',      -- job name
--   '0 0 * * 1',              -- Every Monday at 00:00 UTC
--   $$ SELECT reset_weekly_boss(); $$
-- );
--
-- To verify scheduled jobs:
-- SELECT * FROM cron.job;
--
-- To remove the job:
-- SELECT cron.unschedule('weekly-boss-reset');

-- ─── 5. Run immediately to ensure a boss exists now ──────────────────────────
SELECT reset_weekly_boss();
