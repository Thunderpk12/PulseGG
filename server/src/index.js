// server/src/index.ts
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupLeaderboard, broadcastResultUpdate } from './realtime/leaderboard.js';
const app = express();
app.use(cors());
app.use(express.json());
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*', // For development, allow all origins
        methods: ['GET', 'POST']
    }
});
// Setup Realtime Leaderboard
setupLeaderboard(io);
// Basic health check route
app.get('/', (req, res) => {
    res.send('PulseGG API is running');
});
// Mock endpoint to simulate result update
app.post('/api/admin/match-result', (req, res) => {
    const { matchId } = req.body;
    if (!matchId) {
        return res.status(400).json({ error: 'matchId is required' });
    }
    broadcastResultUpdate(io, matchId);
    res.json({ success: true, message: `Result for match ${matchId} broadcasted` });
});
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
//# sourceMappingURL=index.js.map