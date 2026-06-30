import { createClient } from '@supabase/supabase-js';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  userId: string;
  username: string;
  totalPoints: number;
  correctPredictions: number;
}

export interface MatchRow {
  id: string;
  external_id: string;
  game: string;
  tournament: string;
  team_a: string;
  team_b: string;
  scheduled_at: string | null;
  status: 'upcoming' | 'live' | 'finished';
  winner: string | null;
  created_at: string;
}

export interface PredictionRow {
  id: string;
  user_id: string;
  match_id: string;
  predicted_winner: 'team_a' | 'team_b';
  points_earned: number | null;
  created_at: string;
}

// ─── Supabase Client ─────────────────────────────────────────────────────────

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Avoid creating the client if env vars are missing during build/dev without .env
const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// ─── Leaderboard Queries ─────────────────────────────────────────────────────

export async function getLeaderboardSnapshot(): Promise<LeaderboardEntry[]> {
  if (!supabase) {
    console.warn('Supabase client not initialized. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    return [];
  }

  try {
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

// ─── Match Queries ───────────────────────────────────────────────────────────

export async function getMatches(status?: string): Promise<MatchRow[]> {
  if (!supabase) {
    console.warn('[Queries] Supabase client not initialized.');
    return [];
  }

  try {
    let query = supabase
      .from('matches')
      .select('*')
      .order('scheduled_at', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Queries] Error fetching matches:', error);
      return [];
    }

    return (data as MatchRow[]) ?? [];
  } catch (error) {
    console.error('[Queries] Failed to get matches:', error);
    return [];
  }
}

export async function getMatchById(matchId: string): Promise<MatchRow | null> {
  if (!supabase) {
    console.warn('[Queries] Supabase client not initialized.');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('[Queries] Error fetching match by id:', error);
      return null;
    }

    return data as MatchRow;
  } catch (error) {
    console.error('[Queries] Failed to get match by id:', error);
    return null;
  }
}

export async function getMatchByExternalId(
  externalId: string
): Promise<MatchRow | null> {
  if (!supabase) {
    console.warn('[Queries] Supabase client not initialized.');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('external_id', externalId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('[Queries] Error fetching match by external_id:', error);
      return null;
    }

    return data as MatchRow;
  } catch (error) {
    console.error('[Queries] Failed to get match by external_id:', error);
    return null;
  }
}

export async function upsertMatch(match: {
  external_id: string;
  game: string;
  tournament: string;
  team_a: string;
  team_b: string;
  scheduled_at: string | null;
  status: 'upcoming' | 'live' | 'finished';
  winner: string | null;
}): Promise<MatchRow | null> {
  if (!supabase) {
    console.warn('[Queries] Supabase client not initialized.');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('matches')
      .upsert(match, { onConflict: 'external_id' })
      .select()
      .single();

    if (error) {
      console.error('[Queries] Error upserting match:', error);
      return null;
    }

    return data as MatchRow;
  } catch (error) {
    console.error('[Queries] Failed to upsert match:', error);
    return null;
  }
}

// ─── Prediction Queries ──────────────────────────────────────────────────────

export async function createPrediction(
  userId: string,
  matchId: string,
  predictedWinner: string
): Promise<PredictionRow | null> {
  if (!supabase) {
    console.warn('[Queries] Supabase client not initialized.');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('predictions')
      .insert({
        user_id: userId,
        match_id: matchId,
        predicted_winner: predictedWinner,
      })
      .select()
      .single();

    if (error) {
      console.error('[Queries] Error creating prediction:', error);
      throw error;
    }

    return data as PredictionRow;
  } catch (error) {
    console.error('[Queries] Failed to create prediction:', error);
    throw error;
  }
}

export async function getPredictionsByMatch(
  matchId: string
): Promise<PredictionRow[]> {
  if (!supabase) {
    console.warn('[Queries] Supabase client not initialized.');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('match_id', matchId);

    if (error) {
      console.error('[Queries] Error fetching predictions by match:', error);
      return [];
    }

    return (data as PredictionRow[]) ?? [];
  } catch (error) {
    console.error('[Queries] Failed to get predictions by match:', error);
    return [];
  }
}

export async function getPredictionsByUser(
  userId: string
): Promise<PredictionRow[]> {
  if (!supabase) {
    console.warn('[Queries] Supabase client not initialized.');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Queries] Error fetching predictions by user:', error);
      return [];
    }

    return (data as PredictionRow[]) ?? [];
  } catch (error) {
    console.error('[Queries] Failed to get predictions by user:', error);
    return [];
  }
}

export async function getUserPredictionForMatch(
  userId: string,
  matchId: string
): Promise<PredictionRow | null> {
  if (!supabase) {
    console.warn('[Queries] Supabase client not initialized.');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', userId)
      .eq('match_id', matchId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('[Queries] Error fetching user prediction for match:', error);
      return null;
    }

    return data as PredictionRow;
  } catch (error) {
    console.error('[Queries] Failed to get user prediction for match:', error);
    return null;
  }
}

// ─── Scoring Queries ─────────────────────────────────────────────────────────

export async function updatePredictionPoints(
  predictionId: string,
  points: number
): Promise<void> {
  if (!supabase) {
    console.warn('[Queries] Supabase client not initialized.');
    return;
  }

  try {
    const { error } = await supabase
      .from('predictions')
      .update({ points_earned: points })
      .eq('id', predictionId);

    if (error) {
      console.error('[Queries] Error updating prediction points:', error);
    }
  } catch (error) {
    console.error('[Queries] Failed to update prediction points:', error);
  }
}

export async function recalcUserTotalPoints(userId: string): Promise<void> {
  if (!supabase) {
    console.warn('[Queries] Supabase client not initialized.');
    return;
  }

  try {
    // Sum all points_earned for this user
    const { data, error } = await supabase
      .from('predictions')
      .select('points_earned')
      .eq('user_id', userId);

    if (error) {
      console.error('[Queries] Error fetching user predictions for recalc:', error);
      return;
    }

    const totalPoints = (data ?? []).reduce(
      (sum: number, p: any) => sum + (p.points_earned ?? 0),
      0
    );

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ total_points: totalPoints })
      .eq('id', userId);

    if (updateError) {
      console.error('[Queries] Error updating user total_points:', updateError);
    }
  } catch (error) {
    console.error('[Queries] Failed to recalc user total points:', error);
  }
}

