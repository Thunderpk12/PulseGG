// client/src/hooks/useLeaderboard.ts
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface LeaderboardEntry {
  userId: string;
  username: string;
  totalPoints: number;
  correctPredictions: number;
}

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Prevent duplicate connections in React Strict Mode
    if (socketRef.current) return;

    const socket: Socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    // Recebe snapshot inicial (estado completo ao ligar)
    socket.on('leaderboard:snapshot', (data: LeaderboardEntry[]) => {
      setLeaderboard(data);
      setIsLoading(false);
    });

    // Recebe atualizações incrementais
    socket.on('leaderboard:update', ({ leaderboard, timestamp }) => {
      setLeaderboard(leaderboard);
      setLastUpdated(timestamp);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return { leaderboard, lastUpdated, isLoading };
}
