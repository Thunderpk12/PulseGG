// server/src/index.ts
import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupLeaderboard, broadcastResultUpdate } from './realtime/leaderboard.js';
import { startMatchPolling } from './services/matchSync.js';
import { getMatches, getMatchById } from './db/queries.js';
import predictionsRouter from './routes/predictions.js';

const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';

const app = express();
app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST']
  }
});

// Setup Realtime Leaderboard
setupLeaderboard(io);

// Basic health check route
app.get('/', (req, res) => {
  res.send('PulseGG API is running');
});

// ─── Match Endpoints ─────────────────────────────────────────────────────────

// GET /api/matches — List matches, optionally filtered by status
app.get('/api/matches', async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const matches = await getMatches(status);
    res.json(matches);
  } catch (error) {
    console.error('[API] Error fetching matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// GET /api/matches/:id — Get a single match by ID
app.get('/api/matches/:id', async (req, res) => {
  try {
    const match = await getMatchById(req.params.id!);
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }
    res.json(match);
  } catch (error) {
    console.error('[API] Error fetching match:', error);
    res.status(500).json({ error: 'Failed to fetch match' });
  }
});

// ─── Predictions API ─────────────────────────────────────────────────────────

app.use('/api/predictions', predictionsRouter);

// ─── Admin Endpoint ──────────────────────────────────────────────────────────

// Endpoint to handle match result update, protected by service role key or admin secret
app.post('/api/admin/match-result', (req, res) => {
  const authHeader = req.headers.authorization;
  const adminSecret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.ADMIN_SECRET;

  if (!authHeader || !adminSecret || authHeader !== `Bearer ${adminSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { matchId } = req.body;
  if (!matchId) {
    return res.status(400).json({ error: 'matchId is required' });
  }

  // TODO: Call scoring logic here before broadcasting

  broadcastResultUpdate(io, matchId);
  res.json({ success: true, message: `Result for match ${matchId} broadcasted` });
});

// ─── Start Server ────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);

  // Start polling PandaScore for match updates
  startMatchPolling(io);
});

