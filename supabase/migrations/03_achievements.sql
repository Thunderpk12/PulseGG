-- Migration 03: User Achievements
-- Persists unlocked achievements to the database.
-- Run this in the Supabase SQL Editor.

-- ── 1. Table ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_achievements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  earned_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_key)
);

-- ── 2. RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Users can only read their own achievements
CREATE POLICY "Users can read own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own achievements
CREATE POLICY "Users can insert own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ── 3. RPC: unlock_achievement ───────────────────────────────────────────────
-- Idempotent: does nothing if the achievement is already earned.
CREATE OR REPLACE FUNCTION unlock_achievement(
  p_user_id UUID,
  p_key     TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_achievements (user_id, achievement_key)
  VALUES (p_user_id, p_key)
  ON CONFLICT (user_id, achievement_key) DO NOTHING;
END;
$$;

-- ── 4. RPC: fetch_achievements ───────────────────────────────────────────────
-- Returns all achievement keys earned by a user.
CREATE OR REPLACE FUNCTION fetch_achievements(p_user_id UUID)
RETURNS TABLE(achievement_key TEXT, earned_at TIMESTAMPTZ)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT achievement_key, earned_at
  FROM user_achievements
  WHERE user_id = p_user_id
  ORDER BY earned_at ASC;
$$;

-- ── 5. Optional: Grant execute to authenticated users ────────────────────────
GRANT EXECUTE ON FUNCTION unlock_achievement(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION fetch_achievements(UUID) TO authenticated;
