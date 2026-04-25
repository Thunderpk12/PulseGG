-- Users / Profiles
CREATE TABLE profiles (
  id uuid references auth.users primary key,
  username text unique,
  level integer default 1,
  xp integer default 0,
  coins integer default 0,
  streak integer default 0,
  last_active date,
  equipped_icon_id uuid,
  equipped_title_id uuid,
  guild_id uuid,
  created_at timestamptz default now()
);

-- Habits
CREATE TABLE habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  name text,
  category text, -- 'nutrition','hygiene','exercise','study','work','wellness','sleep','custom'
  difficulty text, -- 'easy','medium','hard'
  frequency text, -- 'daily','weekly','custom'
  custom_days integer[], -- [1,3,5] for Mon/Wed/Fri
  xp_reward integer,
  coin_reward integer,
  reminder_time time,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Habit Completions
CREATE TABLE habit_completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references habits(id),
  user_id uuid references profiles(id),
  completed_at timestamptz default now(),
  xp_earned integer,
  coins_earned integer
);

-- Shop Items
CREATE TABLE shop_items (
  id uuid primary key default gen_random_uuid(),
  name text,
  type text, -- 'icon','title','theme'
  rarity text, -- 'common','rare','epic','legendary'
  price_coins integer,
  asset_path text,
  is_limited boolean default false,
  event_id uuid
);

-- User Inventory
CREATE TABLE user_inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  item_id uuid references shop_items(id),
  acquired_at timestamptz default now()
);

-- Achievements
CREATE TABLE achievements (
  id uuid primary key default gen_random_uuid(),
  name text,
  description text,
  category text,
  condition_type text, -- 'streak','volume','social','secret'
  condition_value integer,
  xp_reward integer,
  badge_asset text
);

-- User Achievements
CREATE TABLE user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  achievement_id uuid references achievements(id),
  unlocked_at timestamptz default now()
);

-- Guilds
CREATE TABLE guilds (
  id uuid primary key default gen_random_uuid(),
  name text unique,
  emblem_asset text,
  total_xp integer default 0,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Weekly Boss
CREATE TABLE weekly_boss (
  id uuid primary key default gen_random_uuid(),
  name text,
  max_hp integer,
  current_hp integer,
  illustration_asset text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_defeated boolean default false
);

-- Boss Damage Log
CREATE TABLE boss_damage (
  id uuid primary key default gen_random_uuid(),
  boss_id uuid references weekly_boss(id),
  user_id uuid references profiles(id),
  damage integer,
  habit_completion_id uuid references habit_completions(id),
  dealt_at timestamptz default now()
);

-- Loot Boxes
CREATE TABLE loot_boxes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  rarity text,
  opened boolean default false,
  item_received_id uuid references shop_items(id),
  acquired_at timestamptz default now()
);

-- Seasonal Events
CREATE TABLE seasonal_events (
  id uuid primary key default gen_random_uuid(),
  name text,
  theme text,
  starts_at timestamptz,
  ends_at timestamptz,
  background_asset text
);

-- Notifications
CREATE TABLE notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  type text, -- 'alert','reward','social','event'
  title text,
  body text,
  is_read boolean default false,
  created_at timestamptz default now()
);
