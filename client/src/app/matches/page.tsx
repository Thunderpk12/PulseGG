'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';

// ─── Types ───────────────────────────────────────────────────
interface Match {
  id: string;
  game: 'cs2' | 'valorant' | 'lol';
  tournament: string;
  teamA: string;
  teamB: string;
  scheduledAt: string;
  status: 'upcoming' | 'live' | 'finished';
  winner?: string;
  scoreA?: number;
  scoreB?: number;
}

interface Prediction {
  id: string;
  matchId: string;
  userId: string;
  predictedWinner: string;
}

interface PredictionStats {
  [matchId: string]: { teamA: number; teamB: number };
}

// ─── Game config ─────────────────────────────────────────────
const GAME_CONFIG: Record<string, { label: string; icon: string; color: string; bgClass: string; textClass: string }> = {
  cs2: { label: 'CS2', icon: '🎯', color: '#F5A623', bgClass: 'game-cs2-bg', textClass: 'game-cs2' },
  valorant: { label: 'VAL', icon: '🔫', color: '#FF4655', bgClass: 'game-valorant-bg', textClass: 'game-valorant' },
  lol: { label: 'LoL', icon: '⚔️', color: '#C89B3C', bgClass: 'game-lol-bg', textClass: 'game-lol' },
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Skeleton Loader ─────────────────────────────────────────
function MatchCardSkeleton() {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="skeleton w-16 h-6" />
        <div className="skeleton w-24 h-4" />
      </div>
      <div className="flex items-center justify-between">
        <div className="skeleton w-28 h-8" />
        <div className="skeleton w-12 h-6" />
        <div className="skeleton w-28 h-8" />
      </div>
      <div className="flex gap-3">
        <div className="skeleton w-full h-10" />
        <div className="skeleton w-full h-10" />
      </div>
    </div>
  );
}

// ─── Match Card ──────────────────────────────────────────────
function MatchCard({
  match,
  prediction,
  stats,
  onPredict,
  isPredicting,
  isLoggedIn,
}: {
  match: Match;
  prediction?: Prediction;
  stats?: { teamA: number; teamB: number };
  onPredict: (matchId: string, team: string) => void;
  isPredicting: string | null;
  isLoggedIn: boolean;
}) {
  const game = GAME_CONFIG[match.game] || GAME_CONFIG.cs2;
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';
  const isUpcoming = match.status === 'upcoming';
  const canPredict = isUpcoming && isLoggedIn;
  const userPrediction = prediction?.predictedWinner;
  const totalPredictions = (stats?.teamA || 0) + (stats?.teamB || 0);
  const teamAPercent = totalPredictions > 0 ? Math.round(((stats?.teamA || 0) / totalPredictions) * 100) : 50;
  const teamBPercent = totalPredictions > 0 ? 100 - teamAPercent : 50;

  const scheduledDate = new Date(match.scheduledAt);
  const timeStr = scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = scheduledDate.toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <div className={`glass-card-hover p-5 sm:p-6 animate-fadeIn relative overflow-hidden ${
      isLive ? 'border-red-500/30 shadow-red-500/5 shadow-lg' : ''
    } ${isFinished ? 'opacity-80' : ''}`}>
      {/* Live glow effect */}
      {isLive && (
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-red-500/5 pointer-events-none" />
      )}

      {/* Top row: Game badge + Tournament + Time */}
      <div className="flex items-center justify-between mb-4 relative">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${game.bgClass} ${game.textClass}`}>
            <span>{game.icon}</span>
            {game.label}
          </span>
          <span className="text-xs text-gray-500 truncate max-w-[140px]">{match.tournament}</span>
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-livePulse absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              LIVE
            </span>
          )}
          {isFinished && (
            <span className="text-xs text-gray-500 font-medium">✅ Finished</span>
          )}
          {isUpcoming && (
            <span className="text-xs text-gray-500">
              {dateStr} · {timeStr}
            </span>
          )}
        </div>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 text-center">
          <p className={`text-base sm:text-lg font-bold truncate px-1 ${
            isFinished && match.winner === match.teamA ? 'text-green-400' :
            isFinished && match.winner === match.teamB ? 'text-red-400/60' : 'text-white'
          }`}>
            {match.teamA}
          </p>
          {isFinished && match.scoreA !== undefined && (
            <p className="text-2xl font-black text-gray-400 mt-1">{match.scoreA}</p>
          )}
        </div>

        <div className="mx-3 sm:mx-4 flex flex-col items-center">
          <span className="text-xs font-bold text-gray-600 bg-gray-800 px-3 py-1.5 rounded-lg">
            VS
          </span>
        </div>

        <div className="flex-1 text-center">
          <p className={`text-base sm:text-lg font-bold truncate px-1 ${
            isFinished && match.winner === match.teamB ? 'text-green-400' :
            isFinished && match.winner === match.teamA ? 'text-red-400/60' : 'text-white'
          }`}>
            {match.teamB}
          </p>
          {isFinished && match.scoreB !== undefined && (
            <p className="text-2xl font-black text-gray-400 mt-1">{match.scoreB}</p>
          )}
        </div>
      </div>

      {/* Prediction stats bar */}
      {totalPredictions > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{teamAPercent}%</span>
            <span className="text-gray-600">{totalPredictions} predictions</span>
            <span>{teamBPercent}%</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden flex">
            <div
              className="bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500 rounded-l-full"
              style={{ width: `${teamAPercent}%` }}
            />
            <div
              className="bg-gradient-to-r from-pink-400 to-pink-500 transition-all duration-500 rounded-r-full"
              style={{ width: `${teamBPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Prediction buttons */}
      {isUpcoming && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => canPredict && onPredict(match.id, match.teamA)}
              disabled={!canPredict || isPredicting === match.id}
              className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-300
                ${userPrediction === match.teamA
                  ? 'bg-purple-500/20 border-2 border-purple-500 text-purple-300 shadow-lg shadow-purple-500/10'
                  : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-purple-500/10 hover:border-purple-500/30 hover:text-white'
                }
                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/5 disabled:hover:border-white/10 disabled:hover:text-gray-400
              `}
            >
              {isPredicting === match.id ? (
                <svg className="animate-spin h-4 w-4 mx-auto" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>
                  {userPrediction === match.teamA && <span className="mr-1">✓</span>}
                  {match.teamA}
                </>
              )}
            </button>

            <button
              onClick={() => canPredict && onPredict(match.id, match.teamB)}
              disabled={!canPredict || isPredicting === match.id}
              className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-300
                ${userPrediction === match.teamB
                  ? 'bg-pink-500/20 border-2 border-pink-500 text-pink-300 shadow-lg shadow-pink-500/10'
                  : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-pink-500/10 hover:border-pink-500/30 hover:text-white'
                }
                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/5 disabled:hover:border-white/10 disabled:hover:text-gray-400
              `}
            >
              {isPredicting === match.id ? (
                <svg className="animate-spin h-4 w-4 mx-auto" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>
                  {userPrediction === match.teamB && <span className="mr-1">✓</span>}
                  {match.teamB}
                </>
              )}
            </button>
          </div>

          {!isLoggedIn && (
            <p className="text-center text-xs text-gray-500">
              <a href="/login" className="text-purple-400 hover:text-purple-300 transition-colors">Log in</a> to make predictions
            </p>
          )}

          {userPrediction && isFinished && (
            <div className={`text-center text-sm font-medium mt-1 ${
              userPrediction === match.winner ? 'text-green-400' : 'text-red-400'
            }`}>
              {userPrediction === match.winner ? '🎉 Correct!' : '❌ Incorrect'}
            </div>
          )}
        </div>
      )}

      {/* Show prediction result on finished matches */}
      {isFinished && userPrediction && (
        <div className={`mt-3 p-3 rounded-xl text-center text-sm font-medium ${
          userPrediction === match.winner
            ? 'bg-green-500/10 border border-green-500/20 text-green-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          You predicted: {userPrediction} {userPrediction === match.winner ? '🎉 Correct!' : '❌ Wrong'}
        </div>
      )}

      {/* Live matches — show prediction */}
      {isLive && userPrediction && (
        <div className="mt-3 p-3 rounded-xl text-center text-sm font-medium bg-purple-500/10 border border-purple-500/20 text-purple-300">
          Your prediction: {userPrediction} 🤞
        </div>
      )}
    </div>
  );
}

// ─── Match Section ───────────────────────────────────────────
function MatchSection({
  title,
  icon,
  matches,
  predictions,
  stats,
  onPredict,
  isPredicting,
  isLoggedIn,
  accentColor,
}: {
  title: string;
  icon: string;
  matches: Match[];
  predictions: Record<string, Prediction>;
  stats: PredictionStats;
  onPredict: (matchId: string, team: string) => void;
  isPredicting: string | null;
  isLoggedIn: boolean;
  accentColor: string;
}) {
  if (matches.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-5">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${accentColor}`}>
          {matches.length}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {matches.map((match, i) => (
          <div key={match.id} style={{ animationDelay: `${i * 0.05}s` }}>
            <MatchCard
              match={match}
              prediction={predictions[match.id]}
              stats={stats[match.id]}
              onPredict={onPredict}
              isPredicting={isPredicting}
              isLoggedIn={isLoggedIn}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function MatchesPage() {
  const { user, session } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [stats, setStats] = useState<PredictionStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const socketRef = useRef<Socket | null>(null);

  // Fetch matches
  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/matches`);
      if (!res.ok) throw new Error('Failed to fetch matches');
      const data = await res.json();
      setMatches(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError('Unable to load matches. Is the server running?');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user predictions
  const fetchMyPredictions = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`${API_BASE}/api/predictions/my`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      const data: Prediction[] = await res.json();
      const predMap: Record<string, Prediction> = {};
      data.forEach((p) => { predMap[p.matchId] = p; });
      setPredictions(predMap);
    } catch (err) {
      console.error('Error fetching predictions:', err);
    }
  }, [session?.access_token]);

  // Initial data load
  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Load predictions when user logs in
  useEffect(() => {
    if (session?.access_token) {
      fetchMyPredictions();
    } else {
      setPredictions({});
    }
  }, [session?.access_token, fetchMyPredictions]);

  // Socket.io for real-time match updates
  useEffect(() => {
    if (socketRef.current) return;

    const socket: Socket = io(API_BASE, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('matches:update', (updatedMatches: Match[]) => {
      setMatches(updatedMatches);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Handle prediction
  const handlePredict = async (matchId: string, predictedWinner: string) => {
    if (!session?.access_token || !user) return;
    setIsPredicting(matchId);

    try {
      const res = await fetch(`${API_BASE}/api/predictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ matchId, predictedWinner, userId: user.id }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit prediction');
      }

      const prediction = await res.json();
      setPredictions((prev) => ({ ...prev, [matchId]: prediction }));

      // Update stats locally
      setStats((prev) => {
        const existing = prev[matchId] || { teamA: 0, teamB: 0 };
        const match = matches.find((m) => m.id === matchId);
        if (!match) return prev;
        const oldPred = predictions[matchId]?.predictedWinner;
        const newStats = { ...existing };

        // Remove old prediction count
        if (oldPred === match.teamA) newStats.teamA = Math.max(0, newStats.teamA - 1);
        if (oldPred === match.teamB) newStats.teamB = Math.max(0, newStats.teamB - 1);

        // Add new prediction count
        if (predictedWinner === match.teamA) newStats.teamA++;
        if (predictedWinner === match.teamB) newStats.teamB++;

        return { ...prev, [matchId]: newStats };
      });
    } catch (err) {
      console.error('Prediction error:', err);
      alert(err instanceof Error ? err.message : 'Failed to submit prediction');
    } finally {
      setIsPredicting(null);
    }
  };

  // Group matches
  const liveMatches = matches.filter((m) => m.status === 'live');
  const upcomingMatches = matches.filter((m) => m.status === 'upcoming')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const finishedMatches = matches.filter((m) => m.status === 'finished')
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  // Game filter
  const gameFilters = ['all', 'cs2', 'valorant', 'lol'];
  const filterMatches = (arr: Match[]) =>
    filter === 'all' ? arr : arr.filter((m) => m.game === filter);

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-pink-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
          Matches
        </h1>
        <p className="text-gray-400">
          Predict match outcomes and climb the leaderboard
        </p>
      </div>

      {/* Game Filters */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {gameFilters.map((g) => {
          const isActive = filter === g;
          const config = g === 'all' ? null : GAME_CONFIG[g];
          return (
            <button
              key={g}
              onClick={() => setFilter(g)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap
                ${isActive
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'
                }`}
            >
              {config ? (
                <>
                  <span>{config.icon}</span>
                  {config.label}
                </>
              ) : (
                'All Games'
              )}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <MatchCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="glass-card p-8 text-center animate-fadeIn">
          <div className="text-4xl mb-4">😵</div>
          <h3 className="text-lg font-semibold text-white mb-2">Connection Error</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => { setLoading(true); fetchMatches(); }}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Matches */}
      {!loading && !error && (
        <>
          {matches.length === 0 ? (
            <div className="glass-card p-12 text-center animate-fadeIn">
              <div className="text-5xl mb-4">🎮</div>
              <h3 className="text-xl font-semibold text-white mb-2">No matches yet</h3>
              <p className="text-gray-400">Check back soon for upcoming matches!</p>
            </div>
          ) : (
            <>
              <MatchSection
                title="Live Now"
                icon="🔴"
                matches={filterMatches(liveMatches)}
                predictions={predictions}
                stats={stats}
                onPredict={handlePredict}
                isPredicting={isPredicting}
                isLoggedIn={!!user}
                accentColor="bg-red-500/20 text-red-400"
              />
              <MatchSection
                title="Upcoming"
                icon="📅"
                matches={filterMatches(upcomingMatches)}
                predictions={predictions}
                stats={stats}
                onPredict={handlePredict}
                isPredicting={isPredicting}
                isLoggedIn={!!user}
                accentColor="bg-purple-500/20 text-purple-400"
              />
              <MatchSection
                title="Recently Finished"
                icon="✅"
                matches={filterMatches(finishedMatches)}
                predictions={predictions}
                stats={stats}
                onPredict={handlePredict}
                isPredicting={isPredicting}
                isLoggedIn={!!user}
                accentColor="bg-gray-500/20 text-gray-400"
              />

              {filterMatches(liveMatches).length === 0 &&
               filterMatches(upcomingMatches).length === 0 &&
               filterMatches(finishedMatches).length === 0 && (
                <div className="glass-card p-12 text-center animate-fadeIn">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-lg font-semibold text-white mb-2">No matches found</h3>
                  <p className="text-gray-400">No matches for this game filter. Try &quot;All Games&quot;.</p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
