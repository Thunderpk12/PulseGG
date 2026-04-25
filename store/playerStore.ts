/**
 * playerStore.ts
 * Holds live player stats synced from Supabase.
 * Provides XP/coin/streak mutation helpers that write back to DB.
 */
import { create } from 'zustand';
import { fetchProfile, updateProfile, Profile } from '../utils/habitService';
import {
  applyXpGain,
  calculateStreakUpdate,
  getTitleForLevel,
  xpThresholdForLevel,
  xpWithinCurrentLevel,
  xpForNextLevel,
} from '../utils/gamification';

interface PlayerState {
  // Raw DB fields
  profile: Profile | null;
  // Derived / convenience
  title: string;
  /** XP within current level (for XpBar) */
  currentLevelXp: number;
  /** Max XP within current level (for XpBar) */
  maxLevelXp: number;
  // UI state
  isLoading: boolean;
  justLeveledUp: boolean;
  newLevel: number;

  // Actions
  loadProfile: (userId: string) => Promise<void>;
  awardXp: (userId: string, amount: number) => Promise<{ leveledUp: boolean; newLevel: number }>;
  awardCoins: (userId: string, amount: number) => Promise<void>;
  updateStreak: (userId: string) => Promise<void>;
  clearLevelUpFlag: () => void;
  reset: () => void;
}

function deriveDisplayValues(profile: Profile) {
  const { level, xp } = profile;
  const currentLevelXp = xpWithinCurrentLevel(xp, level);
  const maxLevelXp = xpForNextLevel(level);
  const title = getTitleForLevel(level);
  return { currentLevelXp, maxLevelXp, title };
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  profile: null,
  title: 'Novice Explorer',
  currentLevelXp: 0,
  maxLevelXp: 100,
  isLoading: false,
  justLeveledUp: false,
  newLevel: 1,

  loadProfile: async (userId: string) => {
    set({ isLoading: true });
    const profile = await fetchProfile(userId);
    if (profile) {
      set({
        profile,
        ...deriveDisplayValues(profile),
        isLoading: false,
      });
    } else {
      set({ isLoading: false });
    }
  },

  awardXp: async (userId: string, amount: number) => {
    const { profile } = get();
    if (!profile) return { leveledUp: false, newLevel: 1 };

    const result = applyXpGain(profile.xp, profile.level, amount);
    const updatedProfile: Profile = {
      ...profile,
      xp: result.newTotalXp,
      level: result.newLevel,
    };

    set({
      profile: updatedProfile,
      ...deriveDisplayValues(updatedProfile),
      justLeveledUp: result.leveledUp,
      newLevel: result.newLevel,
    });

    // Persist to Supabase
    await updateProfile(userId, { xp: result.newTotalXp, level: result.newLevel });

    return { leveledUp: result.leveledUp, newLevel: result.newLevel };
  },

  awardCoins: async (userId: string, amount: number) => {
    const { profile } = get();
    if (!profile) return;

    const newCoins = profile.coins + amount;
    set({ profile: { ...profile, coins: newCoins } });
    await updateProfile(userId, { coins: newCoins });
  },

  updateStreak: async (userId: string) => {
    const { profile } = get();
    if (!profile) return;

    const lastActive = profile.last_active ? new Date(profile.last_active) : null;
    const streakResult = calculateStreakUpdate(lastActive);

    if (!streakResult.streakExtended && !streakResult.streakBroken) return;

    const newStreak = streakResult.streakBroken
      ? 1
      : profile.streak + streakResult.newStreak;

    const updatedProfile: Profile = {
      ...profile,
      streak: newStreak,
      last_active: new Date().toISOString().split('T')[0],
    };
    set({ profile: updatedProfile });

    await updateProfile(userId, {
      streak: newStreak,
      last_active: updatedProfile.last_active,
    });
  },

  clearLevelUpFlag: () => set({ justLeveledUp: false }),

  reset: () =>
    set({
      profile: null,
      title: 'Novice Explorer',
      currentLevelXp: 0,
      maxLevelXp: 100,
      isLoading: false,
      justLeveledUp: false,
      newLevel: 1,
    }),
}));
