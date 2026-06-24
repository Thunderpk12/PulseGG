export interface LeaderboardEntry {
    userId: string;
    username: string;
    totalPoints: number;
    correctPredictions: number;
}
export declare function getLeaderboardSnapshot(): Promise<LeaderboardEntry[]>;
//# sourceMappingURL=queries.d.ts.map