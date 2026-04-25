/**
 * habitService.ts
 * Supabase data-access layer for habits and profile management.
 * All UI concerns are kept out — this layer only speaks to the DB.
 */
import { supabase } from './supabase';
import { getBossDamage, calculateStreakUpdate, applyXpGain } from './gamification';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface Profile {
  id: string;
  username: string | null;
  level: number;
  xp: number;
  coins: number;
  streak: number;
  last_active: string | null;
  equipped_icon_id: string | null;
  equipped_title_id: string | null;
  guild_id: string | null;
  created_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  category: string;
  difficulty: string;
  frequency: string;
  custom_days: number[] | null;
  xp_reward: number;
  coin_reward: number;
  reminder_time: string | null;
  is_active: boolean;
  created_at: string;
  /** Injected client-side after fetching completions */
  isCompletedToday?: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  type: string;
  rarity: string;
  price_coins: number;
  asset_path: string | null;
  is_limited: boolean;
  event_id: string | null;
}

export interface WeeklyBoss {
  id: string;
  name: string;
  max_hp: number;
  current_hp: number;
  illustration_asset: string | null;
  starts_at: string;
  ends_at: string;
  is_defeated: boolean;
}

export interface CreateHabitPayload {
  name: string;
  category: string;
  difficulty: string;
  frequency: string;
  custom_days?: number[];
  xp_reward: number;
  coin_reward: number;
  reminder_time?: string;
}

// ──────────────────────────────────────────────
// Profile
// ──────────────────────────────────────────────

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('[habitService] fetchProfile error:', error.message);
    return null;
  }
  return data as Profile;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Omit<Profile, 'id' | 'created_at'>>
): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) {
    console.error('[habitService] updateProfile error:', error.message);
    return false;
  }
  return true;
}

// ──────────────────────────────────────────────
// Habits
// ──────────────────────────────────────────────

/**
 * Returns all habits for the user that are scheduled for today.
 * Also annotates each habit with `isCompletedToday`.
 */
export async function fetchTodayHabits(userId: string): Promise<Habit[]> {
  const today = new Date();
  const todayDay = today.getDay(); // 0 = Sunday … 6 = Saturday
  const todayDate = today.toISOString().split('T')[0]; // YYYY-MM-DD

  // Fetch active habits
  const { data: habits, error: habitsError } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (habitsError || !habits) {
    console.error('[habitService] fetchTodayHabits error:', habitsError?.message);
    return [];
  }

  // Fetch today's completions
  const { data: completions } = await supabase
    .from('habit_completions')
    .select('habit_id')
    .eq('user_id', userId)
    .gte('completed_at', `${todayDate}T00:00:00.000Z`)
    .lte('completed_at', `${todayDate}T23:59:59.999Z`);

  const completedIds = new Set((completions ?? []).map((c: { habit_id: string }) => c.habit_id));

  // Filter to habits due today
  const todayHabits = (habits as Habit[]).filter((h) => {
    if (h.frequency === 'daily') return true;
    if (h.frequency === 'weekly') {
      // Show on any day — weekly check-in
      return true;
    }
    if (h.frequency === 'custom' && h.custom_days) {
      return h.custom_days.includes(todayDay);
    }
    return true;
  });

  return todayHabits.map((h) => ({
    ...h,
    isCompletedToday: completedIds.has(h.id),
  }));
}

/**
 * Completes a habit: inserts a completion record, updates profile stats,
 * and deals boss damage — all via the `complete_habit` RPC for atomicity.
 */
export async function completeHabit(
  habit: Habit,
  userId: string,
  currentProfile: Profile,
  activeBossId: string | null
): Promise<{ success: boolean; xpGained: number; coinsGained: number; leveledUp: boolean; newLevel: number }> {
  const xpGained = habit.xp_reward;
  const coinsGained = habit.coin_reward;
  const bossDmg = activeBossId ? getBossDamage(habit.difficulty) : 0;

  // Call the atomic RPC
  const { error } = await supabase.rpc('complete_habit', {
    p_habit_id: habit.id,
    p_user_id: userId,
    p_xp_earned: xpGained,
    p_coins_earned: coinsGained,
    p_boss_id: activeBossId ?? null,
    p_boss_damage: bossDmg,
  });

  if (error) {
    console.error('[habitService] completeHabit rpc error:', error.message);
    return { success: false, xpGained: 0, coinsGained: 0, leveledUp: false, newLevel: currentProfile.level };
  }

  // Calculate new level client-side for immediate UI feedback
  const xpResult = applyXpGain(currentProfile.xp, currentProfile.level, xpGained);

  // Update level in DB if it changed
  if (xpResult.leveledUp) {
    await supabase
      .from('profiles')
      .update({ level: xpResult.newLevel, xp: xpResult.newTotalXp })
      .eq('id', userId);
  }

  // Update streak
  const lastActive = currentProfile.last_active ? new Date(currentProfile.last_active) : null;
  const streakResult = calculateStreakUpdate(lastActive);
  if (streakResult.streakExtended) {
    await supabase
      .from('profiles')
      .update({
        streak: currentProfile.streak + streakResult.newStreak,
        last_active: new Date().toISOString().split('T')[0],
      })
      .eq('id', userId);
  } else if (streakResult.streakBroken) {
    await supabase
      .from('profiles')
      .update({ streak: 1, last_active: new Date().toISOString().split('T')[0] })
      .eq('id', userId);
  }

  return {
    success: true,
    xpGained,
    coinsGained,
    leveledUp: xpResult.leveledUp,
    newLevel: xpResult.newLevel,
  };
}

/**
 * Creates a new habit for the user.
 */
export async function createHabit(
  userId: string,
  payload: CreateHabitPayload
): Promise<Habit | null> {
  const { data, error } = await supabase
    .from('habits')
    .insert({ ...payload, user_id: userId })
    .select()
    .single();

  if (error) {
    console.error('[habitService] createHabit error:', error.message);
    return null;
  }
  return data as Habit;
}

/**
 * Updates an existing habit's fields.
 */
export async function updateHabit(
  habitId: string,
  payload: Partial<CreateHabitPayload>
): Promise<boolean> {
  const { error } = await supabase
    .from('habits')
    .update(payload)
    .eq('id', habitId);

  if (error) {
    console.error('[habitService] updateHabit error:', error.message);
    return false;
  }
  return true;
}

/**
 * Soft-deletes a habit by setting is_active = false.
 */
export async function deleteHabit(habitId: string): Promise<boolean> {
  const { error } = await supabase
    .from('habits')
    .update({ is_active: false })
    .eq('id', habitId);

  if (error) {
    console.error('[habitService] deleteHabit error:', error.message);
    return false;
  }
  return true;
}


// ──────────────────────────────────────────────
// Shop
// ──────────────────────────────────────────────

export async function fetchShopItems(): Promise<ShopItem[]> {
  const { data, error } = await supabase
    .from('shop_items')
    .select('*')
    .order('price_coins', { ascending: true });

  if (error) {
    console.error('[habitService] fetchShopItems error:', error.message);
    return [];
  }
  return (data ?? []) as ShopItem[];
}

export async function purchaseItem(
  userId: string,
  item: ShopItem,
  currentCoins: number
): Promise<{ success: boolean; message: string }> {
  if (currentCoins < item.price_coins) {
    return { success: false, message: 'Not enough coins' };
  }

  // Deduct coins atomically
  const { error: coinError } = await supabase
    .from('profiles')
    .update({ coins: currentCoins - item.price_coins })
    .eq('id', userId);

  if (coinError) {
    return { success: false, message: coinError.message };
  }

  // Add to inventory
  const { error: invError } = await supabase
    .from('user_inventory')
    .insert({ user_id: userId, item_id: item.id });

  if (invError) {
    return { success: false, message: invError.message };
  }

  return { success: true, message: 'Purchased!' };
}

/** Returns the set of item IDs the user already owns. */
export async function fetchUserInventory(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('user_inventory')
    .select('item_id')
    .eq('user_id', userId);

  if (error) {
    console.error('[habitService] fetchUserInventory error:', error.message);
    return new Set();
  }
  return new Set((data ?? []).map((row: { item_id: string }) => row.item_id));
}

// ──────────────────────────────────────────────
// Weekly Boss
// ──────────────────────────────────────────────

export async function fetchActiveBoss(): Promise<WeeklyBoss | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('weekly_boss')
    .select('*')
    .eq('is_defeated', false)
    .lte('starts_at', now)
    .gte('ends_at', now)
    .order('starts_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[habitService] fetchActiveBoss error:', error.message);
    return null;
  }
  return data as WeeklyBoss | null;
}
