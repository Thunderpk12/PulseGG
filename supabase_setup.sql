-- ─────────────────────────────────────────────────────────────────
-- QuestHabit — Full Database Setup (run this in Supabase SQL Editor)
-- Dashboard: https://supabase.com/dashboard/project/csfahjeisguleoaekmgc/sql/new
-- ─────────────────────────────────────────────────────────────────

-- ── TABLES ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id uuid references auth.users primary key,
  username text unique,
  level integer default 1,
  xp integer default 0,
  coins integer default 100,
  streak integer default 0,
  last_active date,
  equipped_icon_id uuid,
  equipped_title_id uuid,
  guild_id uuid,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text,
  category text,
  difficulty text,
  frequency text,
  custom_days integer[],
  xp_reward integer default 50,
  coin_reward integer default 10,
  reminder_time time,
  is_active boolean default true,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS habit_completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references habits(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  completed_at timestamptz default now(),
  xp_earned integer,
  coins_earned integer
);

CREATE TABLE IF NOT EXISTS shop_items (
  id uuid primary key default gen_random_uuid(),
  name text,
  type text,
  rarity text,
  price_coins integer,
  asset_path text,
  is_limited boolean default false,
  event_id uuid
);

CREATE TABLE IF NOT EXISTS user_inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  item_id uuid references shop_items(id),
  acquired_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS achievements (
  id uuid primary key default gen_random_uuid(),
  name text,
  description text,
  category text,
  condition_type text,
  condition_value integer,
  xp_reward integer,
  badge_asset text
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  achievement_id uuid references achievements(id),
  unlocked_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS weekly_boss (
  id uuid primary key default gen_random_uuid(),
  name text,
  max_hp integer,
  current_hp integer,
  illustration_asset text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_defeated boolean default false
);

CREATE TABLE IF NOT EXISTS boss_damage (
  id uuid primary key default gen_random_uuid(),
  boss_id uuid references weekly_boss(id),
  user_id uuid references profiles(id) on delete cascade,
  damage integer,
  habit_completion_id uuid references habit_completions(id),
  dealt_at timestamptz default now()
);

-- ── AUTO-PROFILE TRIGGER ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, level, xp, coins, streak)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      split_part(NEW.email, '@', 1)
    ),
    1, 0, 100, 0
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── complete_habit RPC ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.complete_habit(
  p_habit_id     uuid,
  p_user_id      uuid,
  p_xp_earned    integer,
  p_coins_earned integer,
  p_boss_id      uuid    DEFAULT NULL,
  p_boss_damage  integer DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := CURRENT_DATE;
BEGIN
  IF EXISTS (
    SELECT 1 FROM habit_completions
    WHERE habit_id = p_habit_id AND user_id = p_user_id
      AND completed_at::date = v_today
  ) THEN RETURN; END IF;

  INSERT INTO habit_completions (habit_id, user_id, xp_earned, coins_earned)
  VALUES (p_habit_id, p_user_id, p_xp_earned, p_coins_earned);

  UPDATE profiles
  SET xp = xp + p_xp_earned, coins = coins + p_coins_earned
  WHERE id = p_user_id;

  IF p_boss_id IS NOT NULL AND p_boss_damage > 0 THEN
    UPDATE weekly_boss
    SET current_hp  = GREATEST(0, current_hp - p_boss_damage),
        is_defeated = (GREATEST(0, current_hp - p_boss_damage) = 0)
    WHERE id = p_boss_id;
  END IF;
END;
$$;

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────

ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits            ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory    ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_boss       ENABLE ROW LEVEL SECURITY;
ALTER TABLE boss_damage       ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users manage own profile"     ON profiles;
  DROP POLICY IF EXISTS "Users select own profile"     ON profiles;
  DROP POLICY IF EXISTS "Users update own profile"     ON profiles;
  DROP POLICY IF EXISTS "Users insert own profile"     ON profiles;
  DROP POLICY IF EXISTS "Users delete own profile"     ON profiles;
  DROP POLICY IF EXISTS "Users manage own habits"      ON habits;
  DROP POLICY IF EXISTS "Users manage own completions" ON habit_completions;
  DROP POLICY IF EXISTS "Anyone reads shop"            ON shop_items;
  DROP POLICY IF EXISTS "Users manage own inventory"   ON user_inventory;
  DROP POLICY IF EXISTS "Anyone reads achievements"    ON achievements;
  DROP POLICY IF EXISTS "Users see own achievements"   ON user_achievements;
  DROP POLICY IF EXISTS "Anyone reads boss"            ON weekly_boss;
  DROP POLICY IF EXISTS "Users log boss damage"        ON boss_damage;
END $$;

CREATE POLICY "Users select own profile" ON profiles FOR SELECT  USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT  WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users delete own profile" ON profiles FOR DELETE  USING (auth.uid() = id);
CREATE POLICY "Users manage own habits"      ON habits            FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own completions" ON habit_completions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone reads shop"            ON shop_items        FOR SELECT USING (true);
CREATE POLICY "Users manage own inventory"   ON user_inventory    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone reads achievements"    ON achievements      FOR SELECT USING (true);
CREATE POLICY "Users see own achievements"   ON user_achievements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone reads boss"            ON weekly_boss       FOR SELECT USING (true);
CREATE POLICY "Users log boss damage"        ON boss_damage       FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── SHOP ITEMS SEED ───────────────────────────────────────────────

DELETE FROM shop_items WHERE true;

INSERT INTO shop_items (name, type, rarity, price_coins, asset_path, is_limited) VALUES
  -- Icons
  ('Aegis Guard',      'icon', 'common',    150, null, false),
  ('Gilded Crest',     'icon', 'rare',      450, null, false),
  ('Ember Spirit',     'icon', 'rare',      800, null, false),
  ('Sylvan Badge',     'icon', 'common',    300, null, false),
  ('Crystal Heart',    'icon', 'epic',     1200, null, false),
  ('Storm Charge',     'icon', 'epic',      650, null, false),
  ('Void Vortex',      'icon', 'epic',      900, null, false),
  ('Wraith Visage',    'icon', 'legendary', 2500, null, false),
  ('Chaos Dice',       'icon', 'legendary', 1800, null, false),
  ('Starfall Aura',    'icon', 'legendary', 3000, null, false),
  -- Titles
  ('The Relentless',   'title', 'common',    200, null, false),
  ('Seeker of Truth',  'title', 'rare',      500, null, false),
  ('Ember Warden',     'title', 'rare',      750, null, false),
  ('Iron Sentinel',    'title', 'epic',     1000, null, false),
  ('Arcane Dreamer',   'title', 'epic',     1500, null, false),
  ('Crown of Kings',   'title', 'legendary', 2000, null, false),
  ('Chaos Incarnate',  'title', 'legendary', 3500, null, true),
  -- Themes
  ('Cosmic Aura',      'theme', 'common',    200, null, false),
  ('Sunset Backdrop',  'theme', 'rare',      500, null, false),
  ('Frost Citadel',    'theme', 'rare',      600, null, false),
  ('Shadow Realm',     'theme', 'epic',     1100, null, false),
  ('Starfield Deep',   'theme', 'epic',     1200, null, false),
  ('Aether Vault',     'theme', 'legendary', 2200, null, false),
  ('Inferno Palace',   'theme', 'legendary', 2800, null, true);

-- ── WEEKLY BOSS SEED (current week) ──────────────────────────────

DELETE FROM weekly_boss WHERE true;

INSERT INTO weekly_boss (name, max_hp, current_hp, starts_at, ends_at, is_defeated) VALUES (
  'Shadow Colossus',
  10000,
  10000,
  date_trunc('week', now()),
  date_trunc('week', now()) + interval '7 days',
  false
);

-- Done!
SELECT 'Setup complete! Tables, RLS, trigger, shop items, and weekly boss are ready.' as status;
