/**
 * bossStore.ts
 * Holds the current weekly boss state with real-time HP subscription.
 */
import { create } from 'zustand';
import { fetchActiveBoss, WeeklyBoss } from '../utils/habitService';
import { supabase } from '../utils/supabase';

interface BossState {
  boss: WeeklyBoss | null;
  isLoading: boolean;

  loadBoss: () => Promise<void>;
  subscribeToHpUpdates: () => () => void;
  reset: () => void;
}

export const useBossStore = create<BossState>((set, get) => ({
  boss: null,
  isLoading: false,

  loadBoss: async () => {
    set({ isLoading: true });
    const boss = await fetchActiveBoss();
    set({ boss, isLoading: false });
  },

  subscribeToHpUpdates: () => {
    const channel = supabase
      .channel('weekly_boss_hp')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'weekly_boss' },
        (payload) => {
          const { boss } = get();
          if (boss && payload.new.id === boss.id) {
            set({
              boss: {
                ...boss,
                current_hp: payload.new.current_hp,
                is_defeated: payload.new.is_defeated,
              },
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  reset: () => set({ boss: null, isLoading: false }),
}));
