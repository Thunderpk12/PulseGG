import { create } from 'zustand';
import {
  fetchTodayHabits,
  completeHabit,
  createHabit,
  updateHabit,
  deleteHabit,
  Habit,
  Profile,
  CreateHabitPayload,
} from '../utils/habitService';
import { supabase } from '../utils/supabase';
import { usePlayerStore } from './playerStore';

interface CompleteResult {
  success: boolean;
  xpGained: number;
  coinsGained: number;
  leveledUp: boolean;
  newLevel: number;
}

interface QuestState {
  habits: Habit[];
  isLoading: boolean;
  error: string | null;

  loadTodayHabits: (userId: string) => Promise<void>;
  completeQuest: (
    habitId: string,
    userId: string,
    profile: Profile,
    activeBossId: string | null
  ) => Promise<CompleteResult>;
  createQuest: (userId: string, payload: CreateHabitPayload) => Promise<boolean>;
  editQuest: (habitId: string, payload: Partial<CreateHabitPayload>) => Promise<boolean>;
  deleteQuest: (habitId: string) => Promise<boolean>;
  subscribeToCompletions: (userId: string) => () => void;
  reset: () => void;
}

export const useQuestStore = create<QuestState>((set, get) => ({
  habits: [],
  isLoading: false,
  error: null,

  loadTodayHabits: async (userId: string) => {
    set({ isLoading: true, error: null });
    const habits = await fetchTodayHabits(userId);
    set({ habits, isLoading: false });
  },

  completeQuest: async (habitId, userId, profile, activeBossId) => {
    const { habits } = get();
    const habit = habits.find((h) => h.id === habitId);
    if (!habit || habit.isCompletedToday) {
      return { success: false, xpGained: 0, coinsGained: 0, leveledUp: false, newLevel: profile.level };
    }

    set({
      habits: habits.map((h) =>
        h.id === habitId ? { ...h, isCompletedToday: true } : h
      ),
    });

    const result = await completeHabit(habit, userId, profile, activeBossId);

    if (!result.success) {
      set({
        habits: habits.map((h) =>
          h.id === habitId ? { ...h, isCompletedToday: false } : h
        ),
        error: 'Failed to complete quest. Please try again.',
      });
    } else {
      const { updateStreak } = usePlayerStore.getState();
      await updateStreak(userId);
    }

    return result;
  },

  createQuest: async (userId: string, payload: CreateHabitPayload) => {
    const newHabit = await createHabit(userId, payload);
    if (!newHabit) return false;

    set((state) => ({
      habits: [...state.habits, { ...newHabit, isCompletedToday: false }],
    }));
    return true;
  },

  editQuest: async (habitId: string, payload: Partial<CreateHabitPayload>) => {
    const success = await updateHabit(habitId, payload);
    if (!success) return false;

    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === habitId ? { ...h, ...payload } : h
      ),
    }));
    return true;
  },

  deleteQuest: async (habitId: string) => {
    const success = await deleteHabit(habitId);
    if (!success) return false;

    set((state) => ({
      habits: state.habits.filter((h) => h.id !== habitId),
    }));
    return true;
  },

  subscribeToCompletions: (userId: string) => {
    const channel = supabase
      .channel(`completions_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'habit_completions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const { habits } = get();
          set({
            habits: habits.map((h) =>
              h.id === payload.new.habit_id ? { ...h, isCompletedToday: true } : h
            ),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  reset: () => set({ habits: [], isLoading: false, error: null }),
}));
