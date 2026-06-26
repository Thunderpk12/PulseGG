# PulseGG

Web platform where registered users make match result predictions for e-sports matches (CS2, Valorant, LoL) **before the start** of each game. When the result is confirmed, a global and tournament leaderboard updates in **real-time** for all connected users.

## Architecture Diagram

```
PandaScore API ──(polling 60s)──► Node.js Server
                                       │
                              Socket.io │ WebSocket
                                       │
                    ┌──────────────────┼──────────────────┐
                 Client A          Client B           Client C
              (snapshot)        (live updates)     (late joiner
                                                   → snapshot
                                                   → updates)
```

## The main technical decision

> "When a client connects in the middle of a session, simply subscribing to the event stream leaves the UI outdated. I solved this by sending a full snapshot at the moment of connection, before adding the socket to the room. This guarantees that the initial state is always consistent, regardless of when the user arrived."

## A real tradeoff

> "I chose polling the PandaScore API every 60s instead of relying on webhooks because the free tier doesn't support them. Internally, I use WebSockets between the server and the clients so that the maximum delay is 60s but the propagation to the clients is immediate."

## Production incident #X

[Placeholder for the GitHub Issue detailing the real documented bug, closed with a PR and referenced here.]

---

## Technologies

- **Frontend:** Next.js, React, TypeScript, TailwindCSS
- **Backend:** Node.js, Express, TypeScript, Socket.io
- **Database:** PostgreSQL (Supabase)
- **E-sports data:** PandaScore API

## Running Locally

### Backend (Server)
```bash
cd server
npm install
npm run build # if using tsc
# run server logic
```

### Frontend (Client)
```bash
cd client
npm install
npm run dev
```