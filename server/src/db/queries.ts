import { createClient } from '@supabase/supabase-js';

export interface LeaderboardEntry {
  userId: string;
  username: string;
  totalPoints: number;
  correctPredictions: number;
}

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Avoid creating the client if env vars are missing during build/dev without .env
const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function getLeaderboardSnapshot(): Promise<LeaderboardEntry[]> {
  if (!supabase) {
    console.warn('Supabase client not initialized. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    return [];
  }

  try {
    // We fetch profiles ordered by total_points descending
    // To get correctPredictions, we'd ideally need a join or a view.
    // For now, we fetch profiles and their predictions to count correct ones.
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        total_points,
        predictions (
          points_earned
        )
      `)
      .order('total_points', { ascending: false });

    if (profilesError) {
      console.error('Error fetching leaderboard:', profilesError);
      return [];
    }

    if (!profilesData) {
      return [];
    }

    return profilesData.map((profile: any) => {
      // Count how many predictions have points_earned > 0
      const correctCount = profile.predictions?.filter((p: any) => p.points_earned && p.points_earned > 0).length || 0;

      return {
        userId: profile.id,
        username: profile.username,
        totalPoints: profile.total_points || 0,
        correctPredictions: correctCount,
      };
    });
  } catch (error) {
    console.error('Failed to get leaderboard snapshot:', error);
    return [];
  }
}
