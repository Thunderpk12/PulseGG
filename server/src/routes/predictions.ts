// server/src/routes/predictions.ts
// Express router for prediction endpoints

import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createPrediction,
  getPredictionsByMatch,
  getPredictionsByUser,
  getUserPredictionForMatch,
  getMatchById,
} from '../db/queries.js';

const router = Router();

/**
 * POST / — Create a prediction
 * Body: { matchId: string, predictedWinner: 'team_a' | 'team_b' }
 * Requires auth.
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { matchId, predictedWinner } = req.body as {
      matchId?: string;
      predictedWinner?: string;
    };

    if (!matchId || !predictedWinner) {
      res
        .status(400)
        .json({ error: 'matchId and predictedWinner are required' });
      return;
    }

    if (predictedWinner !== 'team_a' && predictedWinner !== 'team_b') {
      res
        .status(400)
        .json({ error: 'predictedWinner must be "team_a" or "team_b"' });
      return;
    }

    // Validate match exists and is upcoming
    const match = await getMatchById(matchId);
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    if (match.status !== 'upcoming') {
      res
        .status(400)
        .json({ error: 'Can only predict on upcoming matches' });
      return;
    }

    // Check if user already predicted on this match
    const existing = await getUserPredictionForMatch(userId, matchId);
    if (existing) {
      res
        .status(409)
        .json({ error: 'You have already predicted on this match' });
      return;
    }

    const prediction = await createPrediction(
      userId,
      matchId,
      predictedWinner
    );
    res.status(201).json(prediction);
  } catch (error) {
    console.error('[Predictions] Error creating prediction:', error);
    res.status(500).json({ error: 'Failed to create prediction' });
  }
});

/**
 * GET /my — Get authenticated user's predictions
 * Requires auth.
 */
router.get('/my', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const predictions = await getPredictionsByUser(userId);
    res.json(predictions);
  } catch (error) {
    console.error('[Predictions] Error fetching user predictions:', error);
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

/**
 * GET /match/:matchId — Get all predictions for a match
 */
router.get('/match/:matchId', async (req: Request, res: Response) => {
  try {
    const matchId = req.params.matchId as string;
    if (!matchId) {
      res.status(400).json({ error: 'matchId param required' });
      return;
    }
    const predictions = await getPredictionsByMatch(matchId);
    res.json(predictions);
  } catch (error) {
    console.error('[Predictions] Error fetching match predictions:', error);
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

/**
 * GET /user/:userId — Get a user's predictions
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    if (!userId) {
      res.status(400).json({ error: 'userId param required' });
      return;
    }
    const predictions = await getPredictionsByUser(userId);
    res.json(predictions);
  } catch (error) {
    console.error('[Predictions] Error fetching user predictions:', error);
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

export default router;
