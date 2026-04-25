-- ============================================================
-- Row Level Security Policies — QuestHabit
-- Run this after 00_initial_schema.sql
-- ============================================================

-- Enable RLS on all user-scoped tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE boss_damage ENABLE ROW LEVEL SECURITY;
ALTER TABLE loot_boxes ENABLE ROW LEVEL SECURITY;

-- Enable RLS on global read-only tables
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_boss ENABLE ROW LEVEL SECURITY;
ALTER TABLE guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasonal_events ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- profiles
-- ============================================================
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- habits
-- ============================================================
CREATE POLICY "Users can manage own habits"
  ON habits FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- habit_completions
-- ============================================================
CREATE POLICY "Users can manage own completions"
  ON habit_completions FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- user_inventory
-- ============================================================
CREATE POLICY "Users can view own inventory"
  ON user_inventory FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory"
  ON user_inventory FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- user_achievements
-- ============================================================
CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- notifications
-- ============================================================
CREATE POLICY "Users can manage own notifications"
  ON notifications FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- boss_damage
-- ============================================================
CREATE POLICY "Users can view own boss damage"
  ON boss_damage FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own boss damage"
  ON boss_damage FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- loot_boxes
-- ============================================================
CREATE POLICY "Users can manage own loot boxes"
  ON loot_boxes FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Global read-only tables (all authenticated users)
-- ============================================================
CREATE POLICY "Authenticated users can view shop items"
  ON shop_items FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view achievements"
  ON achievements FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view weekly boss"
  ON weekly_boss FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view guilds"
  ON guilds FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view seasonal events"
  ON seasonal_events FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- Helper function: update profile XP/coins atomically from a
-- database function (called server-side via RPC)
-- ============================================================
CREATE OR REPLACE FUNCTION complete_habit(
  p_habit_id uuid,
  p_user_id uuid,
  p_xp_earned integer,
  p_coins_earned integer,
  p_boss_id uuid DEFAULT NULL,
  p_boss_damage integer DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_completion_id uuid;
BEGIN
  -- Insert completion record
  INSERT INTO habit_completions (habit_id, user_id, xp_earned, coins_earned)
  VALUES (p_habit_id, p_user_id, p_xp_earned, p_coins_earned)
  RETURNING id INTO v_completion_id;

  -- Update profile XP and coins
  UPDATE profiles
  SET xp = xp + p_xp_earned,
      coins = coins + p_coins_earned,
      last_active = CURRENT_DATE
  WHERE id = p_user_id;

  -- Deal boss damage if a boss is active
  IF p_boss_id IS NOT NULL AND p_boss_damage > 0 THEN
    INSERT INTO boss_damage (boss_id, user_id, damage, habit_completion_id)
    VALUES (p_boss_id, p_user_id, p_boss_damage, v_completion_id);

    UPDATE weekly_boss
    SET current_hp = GREATEST(0, current_hp - p_boss_damage),
        is_defeated = (current_hp - p_boss_damage <= 0)
    WHERE id = p_boss_id;
  END IF;
END;
$$;
