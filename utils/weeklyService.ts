/**
 * weeklyService.ts
 * Fetches real week-completion data for the 7-day streak bar.
 * Returns an array of 7 booleans: index 0 = Monday of the current ISO week.
 */
import { supabase } from './supabase';

/**
 * Returns a boolean[7] where index 0 = Monday and index 6 = Sunday of the
 * current ISO week.  true = user completed at least one habit that day.
 */
export async function fetchWeekCompletionDays(userId: string): Promise<boolean[]> {
  const now   = new Date();
  // ISO week: Monday = 0 … Sunday = 6
  const day   = now.getDay();                     // 0 = Sunday … 6 = Saturday
  const isoDay = (day + 6) % 7;                  // 0 = Monday … 6 = Sunday
  const monday = new Date(now);
  monday.setDate(now.getDate() - isoDay);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('habit_completions')
    .select('completed_at')
    .eq('user_id', userId)
    .gte('completed_at', monday.toISOString())
    .lte('completed_at', sunday.toISOString());

  if (error || !data) {
    console.warn('[weeklyService] fetchWeekCompletionDays error:', error?.message);
    return Array(7).fill(false);
  }

  // Mark each ISO day (0=Mon…6=Sun) that has a completion
  const activeDays = new Set<number>();
  for (const row of data) {
    const d = new Date(row.completed_at);
    const iso = (d.getDay() + 6) % 7; // 0=Mon…6=Sun
    activeDays.add(iso);
  }

  return Array.from({ length: 7 }, (_, i) => activeDays.has(i));
}

/**
 * Counts how many days in the current ISO week had at least one completion.
 */
export async function fetchWeekCompletionCount(userId: string): Promise<number> {
  const days = await fetchWeekCompletionDays(userId);
  return days.filter(Boolean).length;
}
