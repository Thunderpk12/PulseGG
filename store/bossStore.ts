/**
 * bossStore.ts
 * Holds the current weekly boss state with real-time HP subscription.
 */
import { create } from 'zustand';

import { fetchActiveBoss, WeeklyBoss } from '../utils/habitService';
import { supabase } from '../utils/supabase';

// Boss names rotate weekly — add more as needed
const WEEKLY_BOSS_NAMES = [
  'The Shadow Titan',
  'Sloth Demon',
  'The Procrastinator',
  'Void Wyrm',
  'Entropy Golem',
  'The Distraction',
  'Chaos Serpent',
  'Iron Slumber',
];

/** Creates a new boss for the current week if none exists. */
async function createWeeklyBoss(): Promise<WeeklyBoss | null> {
  const now = new Date();
  // Get Monday of current week
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  // Get Sunday (end of week)
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // Pick boss name based on ISO week number for consistency
  const weekNum = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 3600 * 1000));
  const bossName = WEEKLY_BOSS_NAMES[weekNum % WEEKLY_BOSS_NAMES.length];

  const { data, error } = await supabase
    .from('weekly_boss')
    .insert({
      name: bossName,
      max_hp: 1000,
      current_hp: 1000,
      starts_at: monday.toISOString(),
      ends_at: sunday.toISOString(),
      is_defeated: false,
    })
    .select()
    .single();

  if (error) {
    console.warn('[bossStore] Could not auto-create boss:', error.message);
    return null;
  }
  return data as WeeklyBoss;
}

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
    let boss = await fetchActiveBoss();
    // Auto-create a boss for this week if none exists
    if (!boss) {
      boss = await createWeeklyBoss();
    }
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
