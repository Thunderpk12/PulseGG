import { create } from 'zustand';
import { fetchProfile, updateProfile, Profile } from '../utils/habitService';
import {
  applyXpGain,
  calculateStreakUpdate,
  getTitleForLevel,
  xpWithinCurrentLevel,
  xpForNextLevel,
} from '../utils/gamification';
import {
  fetchEarnedAchievements,
  checkAndUnlockAchievements,
  fetchTotalCompletions,
  ACHIEVEMENT_DEFS,
} from '../utils/achievementService';

interface PlayerState {
  profile: Profile | null;
  title: string;
  currentLevelXp: number;
  maxLevelXp: number;
  isLoading: boolean;
  justLeveledUp: boolean;
  newLevel: number;
  /** Set of achievement keys already earned (persisted in DB) */
  earnedAchievements: Set<string>;

  loadProfile: (userId: string) => Promise<void>;
  loadAchievements: (userId: string) => Promise<void>;
  checkAchievements: (userId: string) => Promise<string[]>;
  awardXp: (userId: string, amount: number) => Promise<{ leveledUp: boolean; newLevel: number }>;
  awardCoins: (userId: string, amount: number) => Promise<void>;
  updateStreak: (userId: string) => Promise<void>;
  updateProfileField: (userId: string, updates: Partial<Omit<Profile, 'id' | 'created_at'>>) => Promise<boolean>;
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
  earnedAchievements: new Set(),

  loadProfile: async (userId: string) => {
    set({ isLoading: true });
    const [profile, earned] = await Promise.all([
      fetchProfile(userId),
      fetchEarnedAchievements(userId),
    ]);
    if (profile) {
      set({
        profile,
        ...deriveDisplayValues(profile),
        earnedAchievements: earned,
        isLoading: false,
      });
    } else {
      set({ isLoading: false });
    }
  },

  loadAchievements: async (userId: string) => {
    const earned = await fetchEarnedAchievements(userId);
    set({ earnedAchievements: earned });
  },

  checkAchievements: async (userId: string) => {
    const { profile, earnedAchievements } = get();
    if (!profile) return [];

    const totalCompletions = await fetchTotalCompletions(userId);
    const newlyUnlocked = await checkAndUnlockAchievements(
      userId,
      profile,
      totalCompletions,
      earnedAchievements
    );

    if (newlyUnlocked.length > 0) {
      const updated = new Set(earnedAchievements);
      newlyUnlocked.forEach((k) => updated.add(k));
      set({ earnedAchievements: updated });
    }

    return newlyUnlocked;
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

  updateProfileField: async (userId, updates) => {
    const { profile } = get();
    if (!profile) return false;
    const ok = await updateProfile(userId, updates);
    if (ok) {
      set({ profile: { ...profile, ...updates } });
    }
    return ok;
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
      earnedAchievements: new Set(),
    }),
}));
