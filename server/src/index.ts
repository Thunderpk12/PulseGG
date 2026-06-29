// server/src/index.ts
import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupLeaderboard, broadcastResultUpdate } from './realtime/leaderboard.js';

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

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
