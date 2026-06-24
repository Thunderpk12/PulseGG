// server/src/db/queries.ts
// Mocking the database queries for now
const mockLeaderboard = [
    { userId: '1', username: 'Fallen', totalPoints: 120, correctPredictions: 12 },
    { userId: '2', username: 'Coldzera', totalPoints: 100, correctPredictions: 10 },
    { userId: '3', username: 'S1mple', totalPoints: 90, correctPredictions: 9 },
];
export async function getLeaderboardSnapshot() {
    // In a real app, this would query Supabase
    return Promise.resolve(mockLeaderboard);
}
//# sourceMappingURL=queries.js.map