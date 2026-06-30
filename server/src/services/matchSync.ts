// server/src/services/matchSync.ts
// Polls PandaScore for match updates and syncs to Supabase

import type { Server } from 'socket.io';
import { fetchMatches } from './pandascore.js';
import type { MappedMatch } from './pandascore.js';
import {
  upsertMatch,
  getMatchByExternalId,
  getMatches,
} from '../db/queries.js';
import { processMatchResult } from './scoring.js';
import { broadcastResultUpdate } from '../realtime/leaderboard.js';

const POLL_INTERVAL_MS = 60_000; // 60 seconds

async function syncMatches(io: Server): Promise<void> {
  console.log('[MatchSync] Starting sync cycle...');

  try {
    // Fetch all match statuses in parallel
    const [upcoming, running, past] = await Promise.all([
      fetchMatches('upcoming'),
      fetchMatches('running'),
      fetchMatches('past'),
    ]);

    const allMatches: MappedMatch[] = [...upcoming, ...running, ...past];
    console.log(`[MatchSync] Total matches fetched: ${allMatches.length}`);

    let upserted = 0;
    let scored = 0;

    for (const match of allMatches) {
      // Check if the match previously existed with a different status
      const existing = await getMatchByExternalId(match.external_id);
      const wasNotFinished =
        !existing || (existing.status !== 'finished');
      const isNowFinished = match.status === 'finished';
      const hasWinner = match.winner !== null;

      // Upsert the match into DB
      await upsertMatch(match);
      upserted++;

      // If a match just transitioned to 'finished' with a winner, trigger scoring
      if (wasNotFinished && isNowFinished && hasWinner && existing) {
        console.log(
          `[MatchSync] Match ${match.external_id} finished! Winner: ${match.winner}`
        );
        await processMatchResult(existing.id, match.winner!);
        await broadcastResultUpdate(io, existing.id);
        scored++;
      }
    }

    console.log(
      `[MatchSync] Sync complete: ${upserted} upserted, ${scored} scored`
    );

    // Broadcast updated match list to all connected clients
    const currentMatches = await getMatches();
    io.emit('matches:update', currentMatches);
  } catch (error) {
    console.error('[MatchSync] Error during sync cycle:', error);
  }
}

export function startMatchPolling(io: Server): void {
  console.log('[MatchSync] Starting match polling service...');

  // Run immediately on start
  syncMatches(io).catch((err) =>
    console.error('[MatchSync] Initial sync error:', err)
  );

  // Then run every POLL_INTERVAL_MS
  setInterval(() => {
    syncMatches(io).catch((err) =>
      console.error('[MatchSync] Polling sync error:', err)
    );
  }, POLL_INTERVAL_MS);
}
