// server/src/services/scoring.ts
// Handles scoring predictions when a match finishes

import {
  getPredictionsByMatch,
  updatePredictionPoints,
  recalcUserTotalPoints,
} from '../db/queries.js';

const CORRECT_PREDICTION_POINTS = 10;

export async function processMatchResult(
  matchId: string,
  winner: string
): Promise<void> {
  console.log(
    `[Scoring] Processing result for match ${matchId}, winner: ${winner}`
  );

  try {
    const predictions = await getPredictionsByMatch(matchId);

    if (predictions.length === 0) {
      console.log(`[Scoring] No predictions found for match ${matchId}`);
      return;
    }

    console.log(
      `[Scoring] Found ${predictions.length} predictions for match ${matchId}`
    );

    const affectedUserIds = new Set<string>();

    for (const prediction of predictions) {
      const isCorrect = prediction.predicted_winner === winner;
      const points = isCorrect ? CORRECT_PREDICTION_POINTS : 0;

      await updatePredictionPoints(prediction.id, points);
      affectedUserIds.add(prediction.user_id);

      console.log(
        `[Scoring] User ${prediction.user_id}: predicted ${prediction.predicted_winner}, ` +
          `actual ${winner} → ${isCorrect ? 'CORRECT' : 'WRONG'} (${points} pts)`
      );
    }

    // Recalculate total_points for each affected user
    for (const userId of affectedUserIds) {
      await recalcUserTotalPoints(userId);
    }

    console.log(
      `[Scoring] Finished scoring match ${matchId}. ` +
        `Updated ${affectedUserIds.size} user(s).`
    );
  } catch (error) {
    console.error(`[Scoring] Error processing match ${matchId}:`, error);
  }
}
