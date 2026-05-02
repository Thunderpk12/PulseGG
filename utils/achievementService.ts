/**
 * achievementService.ts
 * Defines all achievements, fetches earned ones from Supabase,
 * and provides an idempotent unlock function.
 */
import { supabase } from './supabase';
import { Profile } from './habitService';

// ── Achievement definitions ───────────────────────────────────────────────────

export interface AchievementDef {
  key: string;
  icon: string;
  title: string;
  desc: string;
  /** Returns true if the achievement should be unlocked given the player state */
  condition: (profile: Profile, totalCompletions: number) => boolean;
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    key: 'first_flame',
    icon: '🔥',
    title: 'First Flame',
    desc: 'Complete your first quest',
    condition: (p, total) => total >= 1,
  },
  {
    key: 'rising_star',
    icon: '⭐',
    title: 'Rising Star',
    desc: 'Reach Level 5',
    condition: (p) => p.level >= 5,
  },
  {
    key: 'week_warrior',
    icon: '💎',
    title: 'Week Warrior',
    desc: 'Maintain a 7-day streak',
    condition: (p) => p.streak >= 7,
  },
  {
    key: 'gold_hoarder',
    icon: '🏆',
    title: 'Gold Hoarder',
    desc: 'Earn 500 GP',
    condition: (p) => p.coins >= 500,
  },
  {
    key: 'xp_century',
    icon: '💯',
    title: 'Centurion',
    desc: 'Accumulate 100 XP',
    condition: (p) => p.xp >= 100,
  },
  {
    key: 'hero',
    icon: '⚔️',
    title: 'Hero',
    desc: 'Reach Level 10',
    condition: (p) => p.level >= 10,
  },
  {
    key: 'unstoppable',
    icon: '🌟',
    title: 'Unstoppable',
    desc: 'Complete 50 quests',
    condition: (p, total) => total >= 50,
  },
  {
    key: 'mythic',
    icon: '🔮',
    title: 'Mythic',
    desc: 'Reach Level 20',
    condition: (p) => p.level >= 20,
  },
  {
    key: 'streak_master',
    icon: '🔥',
    title: 'Streak Master',
    desc: 'Maintain a 30-day streak',
    condition: (p) => p.streak >= 30,
  },
  {
    key: 'wealthy',
    icon: '💰',
    title: 'Wealthy',
    desc: 'Earn 2,000 GP',
    condition: (p) => p.coins >= 2000,
  },
];

// ── Fetch ─────────────────────────────────────────────────────────────────────

/**
 * Returns a Set of achievement keys already earned by the user.
 * Falls back to direct table query (no RPC needed for read).
 */
export async function fetchEarnedAchievements(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('achievement_key')
    .eq('user_id', userId);

  if (error) {
    console.warn('[achievementService] fetchEarnedAchievements:', error.message);
    return new Set();
  }

  return new Set((data ?? []).map((row: { achievement_key: string }) => row.achievement_key));
}

// ── Unlock ────────────────────────────────────────────────────────────────────

/**
 * Unlocks a single achievement for a user.
 * Idempotent — calling again has no effect if already earned.
 */
export async function unlockAchievement(userId: string, key: string): Promise<void> {
  const { error } = await supabase.rpc('unlock_achievement', {
    p_user_id: userId,
    p_key: key,
  });

  if (error) {
    console.warn(`[achievementService] unlock "${key}" failed:`, error.message);
  }
}

// ── Check & Unlock ────────────────────────────────────────────────────────────

/**
 * Checks all achievement conditions against the current profile and total completions.
 * For any that are newly earned (not in `alreadyEarned`), calls unlock.
 * Returns the Set of newly unlocked keys.
 */
export async function checkAndUnlockAchievements(
  userId: string,
  profile: Profile,
  totalCompletions: number,
  alreadyEarned: Set<string>
): Promise<string[]> {
  const newlyUnlocked: string[] = [];

  for (const def of ACHIEVEMENT_DEFS) {
    if (alreadyEarned.has(def.key)) continue;
    if (def.condition(profile, totalCompletions)) {
      await unlockAchievement(userId, def.key);
      newlyUnlocked.push(def.key);
    }
  }

  return newlyUnlocked;
}

/**
 * Fetches the total number of habit completions for a user.
 * Used to evaluate "complete N quests" achievements.
 */
export async function fetchTotalCompletions(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('habit_completions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.warn('[achievementService] fetchTotalCompletions:', error.message);
    return 0;
  }

  return count ?? 0;
}
