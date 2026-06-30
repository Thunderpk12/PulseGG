'use client';

import { useLeaderboard } from '@/hooks/useLeaderboard';

const RANK_BADGES = ['🥇', '🥈', '🥉'];
const RANK_COLORS = [
  'from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
  'from-gray-300/20 to-gray-400/20 border-gray-400/30',
  'from-orange-600/20 to-amber-700/20 border-orange-600/30',
];

function getInitials(name: string): string {
  return name
    .split(/[\s_-]+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="glass-card p-4 flex items-center gap-4">
          <div className="skeleton w-8 h-8 rounded-full" />
          <div className="skeleton w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton w-32 h-4" />
            <div className="skeleton w-20 h-3" />
          </div>
          <div className="skeleton w-16 h-6" />
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const { leaderboard, lastUpdated, isLoading } = useLeaderboard();

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-yellow-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="text-center mb-10 animate-fadeIn">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4
                      bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/20">
          <span className="text-3xl">🏆</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
          Leaderboard
        </h1>
        <p className="text-gray-400">
          Top predictors across all e-sports matches
        </p>
        {lastUpdated && (
          <p className="text-xs text-gray-600 mt-2">
            Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Loading */}
      {isLoading && <LeaderboardSkeleton />}

      {/* Empty */}
      {!isLoading && leaderboard.length === 0 && (
        <div className="glass-card p-12 text-center animate-fadeIn">
          <div className="text-5xl mb-4">🎮</div>
          <h3 className="text-xl font-semibold text-white mb-2">No players yet</h3>
          <p className="text-gray-400 mb-4">Be the first to make a prediction!</p>
          <a href="/matches" className="btn-primary inline-block">
            Browse Matches
          </a>
        </div>
      )}

      {/* Leaderboard */}
      {!isLoading && leaderboard.length > 0 && (
        <div className="space-y-3">
          {/* Top 3 Podium */}
          {leaderboard.length >= 3 && (
            <div className="grid grid-cols-3 gap-3 mb-8">
              {/* 2nd place */}
              <div className="glass-card p-5 text-center animate-slideUp order-1 mt-6" style={{ animationDelay: '0.1s' }}>
                <div className="text-3xl mb-2">🥈</div>
                <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center mb-2 ring-2 ring-gray-400/30">
                  <span className="text-lg font-bold text-gray-900">
                    {getInitials(leaderboard[1].username)}
                  </span>
                </div>
                <p className="font-semibold text-white text-sm truncate">{leaderboard[1].username}</p>
                <p className="text-lg font-black text-yellow-400 mt-1">{leaderboard[1].totalPoints}</p>
                <p className="text-xs text-gray-500">{leaderboard[1].correctPredictions} correct</p>
              </div>

              {/* 1st place */}
              <div className="glass-card p-5 text-center animate-slideUp order-2 border-yellow-500/20 shadow-lg shadow-yellow-500/5" style={{ animationDelay: '0s' }}>
                <div className="text-4xl mb-2 animate-float">🥇</div>
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center mb-2 ring-2 ring-yellow-400/40 shadow-lg shadow-yellow-500/20">
                  <span className="text-xl font-bold text-gray-900">
                    {getInitials(leaderboard[0].username)}
                  </span>
                </div>
                <p className="font-bold text-white truncate">{leaderboard[0].username}</p>
                <p className="text-2xl font-black gradient-text-gold mt-1">{leaderboard[0].totalPoints}</p>
                <p className="text-xs text-gray-500">{leaderboard[0].correctPredictions} correct</p>
              </div>

              {/* 3rd place */}
              <div className="glass-card p-5 text-center animate-slideUp order-3 mt-8" style={{ animationDelay: '0.2s' }}>
                <div className="text-3xl mb-2">🥉</div>
                <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-orange-500 to-amber-700 flex items-center justify-center mb-2 ring-2 ring-orange-500/30">
                  <span className="text-lg font-bold text-gray-900">
                    {getInitials(leaderboard[2].username)}
                  </span>
                </div>
                <p className="font-semibold text-white text-sm truncate">{leaderboard[2].username}</p>
                <p className="text-lg font-black text-yellow-400 mt-1">{leaderboard[2].totalPoints}</p>
                <p className="text-xs text-gray-500">{leaderboard[2].correctPredictions} correct</p>
              </div>
            </div>
          )}

          {/* Full list */}
          <div className="glass-card overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[3rem_1fr_6rem_6rem] sm:grid-cols-[4rem_1fr_8rem_8rem] items-center
                          px-4 sm:px-6 py-3 border-b border-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <span>Rank</span>
              <span>Player</span>
              <span className="text-right">Points</span>
              <span className="text-right">Correct</span>
            </div>

            {/* Rows */}
            {leaderboard.map((entry, index) => {
              const isTop3 = index < 3;
              return (
                <div
                  key={entry.userId}
                  className={`grid grid-cols-[3rem_1fr_6rem_6rem] sm:grid-cols-[4rem_1fr_8rem_8rem] items-center
                            px-4 sm:px-6 py-4 border-b border-white/5 last:border-b-0
                            transition-all duration-300 hover:bg-white/[0.03] animate-fadeIn
                            ${isTop3 ? `bg-gradient-to-r ${RANK_COLORS[index]}` : ''}`}
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  {/* Rank */}
                  <div className="flex items-center">
                    {isTop3 ? (
                      <span className="text-xl">{RANK_BADGES[index]}</span>
                    ) : (
                      <span className="text-sm font-bold text-gray-500 w-7 text-center">
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {/* Player */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      isTop3
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                        : 'bg-gradient-to-br from-gray-700 to-gray-600'
                    }`}>
                      <span className="text-xs font-bold text-white">
                        {getInitials(entry.username)}
                      </span>
                    </div>
                    <span className={`font-medium truncate ${isTop3 ? 'text-white' : 'text-gray-300'}`}>
                      {entry.username}
                    </span>
                  </div>

                  {/* Points */}
                  <div className="text-right">
                    <span className={`font-bold ${isTop3 ? 'text-yellow-400 text-lg' : 'text-yellow-400/80'}`}>
                      {entry.totalPoints.toLocaleString()}
                    </span>
                  </div>

                  {/* Correct */}
                  <div className="text-right">
                    <span className={`font-medium ${isTop3 ? 'text-green-400' : 'text-green-400/70'}`}>
                      {entry.correctPredictions}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-black text-white">{leaderboard.length}</p>
              <p className="text-xs text-gray-500 mt-1">Total Players</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-black text-yellow-400">
                {leaderboard.reduce((a, b) => a + b.totalPoints, 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total Points</p>
            </div>
            <div className="glass-card p-4 text-center col-span-2 sm:col-span-1">
              <p className="text-2xl font-black text-green-400">
                {leaderboard.reduce((a, b) => a + b.correctPredictions, 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total Correct</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
