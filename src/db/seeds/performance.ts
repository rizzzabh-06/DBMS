import { db } from '@/db';
import { performance } from '@/db/schema';

async function main() {
    const samplePerformances = [
        // Match 1: India vs Australia
        { matchId: 1, playerId: 1, runsScored: 85, wicketsTaken: 0 },
        { matchId: 1, playerId: 2, runsScored: 5, wicketsTaken: 3 },
        { matchId: 1, playerId: 3, runsScored: 42, wicketsTaken: 2 },
        { matchId: 1, playerId: 4, runsScored: 28, wicketsTaken: 0 },
        { matchId: 1, playerId: 5, runsScored: 55, wicketsTaken: 0 },
        { matchId: 1, playerId: 6, runsScored: 120, wicketsTaken: 0 },
        { matchId: 1, playerId: 7, runsScored: 8, wicketsTaken: 4 },
        { matchId: 1, playerId: 8, runsScored: 32, wicketsTaken: 1 },
        { matchId: 1, playerId: 9, runsScored: 0, wicketsTaken: 2 },
        { matchId: 1, playerId: 10, runsScored: 45, wicketsTaken: 0 },

        // Match 2: England vs Pakistan
        { matchId: 2, playerId: 11, runsScored: 95, wicketsTaken: 0 },
        { matchId: 2, playerId: 12, runsScored: 2, wicketsTaken: 5 },
        { matchId: 2, playerId: 13, runsScored: 68, wicketsTaken: 2 },
        { matchId: 2, playerId: 14, runsScored: 38, wicketsTaken: 1 },
        { matchId: 2, playerId: 15, runsScored: 22, wicketsTaken: 0 },
        { matchId: 2, playerId: 16, runsScored: 110, wicketsTaken: 0 },
        { matchId: 2, playerId: 17, runsScored: 0, wicketsTaken: 3 },
        { matchId: 2, playerId: 18, runsScored: 45, wicketsTaken: 2 },
        { matchId: 2, playerId: 19, runsScored: 58, wicketsTaken: 0 },
        { matchId: 2, playerId: 20, runsScored: 12, wicketsTaken: 1 },

        // Match 3: South Africa vs New Zealand
        { matchId: 3, playerId: 21, runsScored: 75, wicketsTaken: 0 },
        { matchId: 3, playerId: 22, runsScored: 0, wicketsTaken: 2 },
        { matchId: 3, playerId: 23, runsScored: 52, wicketsTaken: 0 },
        { matchId: 3, playerId: 24, runsScored: 35, wicketsTaken: 1 },
        { matchId: 3, playerId: 25, runsScored: 18, wicketsTaken: 3 },
        { matchId: 3, playerId: 26, runsScored: 88, wicketsTaken: 0 },
        { matchId: 3, playerId: 27, runsScored: 5, wicketsTaken: 3 },
        { matchId: 3, playerId: 28, runsScored: 62, wicketsTaken: 0 },
        { matchId: 3, playerId: 29, runsScored: 0, wicketsTaken: 1 },
        { matchId: 3, playerId: 30, runsScored: 48, wicketsTaken: 0 },

        // Match 4: India vs England
        { matchId: 4, playerId: 1, runsScored: 102, wicketsTaken: 0 },
        { matchId: 4, playerId: 2, runsScored: 0, wicketsTaken: 2 },
        { matchId: 4, playerId: 3, runsScored: 28, wicketsTaken: 1 },
        { matchId: 4, playerId: 4, runsScored: 15, wicketsTaken: 2 },
        { matchId: 4, playerId: 5, runsScored: 65, wicketsTaken: 0 },
        { matchId: 4, playerId: 11, runsScored: 88, wicketsTaken: 0 },
        { matchId: 4, playerId: 12, runsScored: 0, wicketsTaken: 3 },
        { matchId: 4, playerId: 13, runsScored: 55, wicketsTaken: 1 },
        { matchId: 4, playerId: 14, runsScored: 42, wicketsTaken: 0 },
        { matchId: 4, playerId: 15, runsScored: 8, wicketsTaken: 0 },

        // Match 5: Australia vs Pakistan
        { matchId: 5, playerId: 6, runsScored: 45, wicketsTaken: 0 },
        { matchId: 5, playerId: 7, runsScored: 12, wicketsTaken: 3 },
        { matchId: 5, playerId: 8, runsScored: 38, wicketsTaken: 1 },
        { matchId: 5, playerId: 9, runsScored: 0, wicketsTaken: 1 },
        { matchId: 5, playerId: 10, runsScored: 72, wicketsTaken: 0 },
        { matchId: 5, playerId: 16, runsScored: 72, wicketsTaken: 0 },
        { matchId: 5, playerId: 17, runsScored: 0, wicketsTaken: 4 },
        { matchId: 5, playerId: 18, runsScored: 52, wicketsTaken: 1 },
        { matchId: 5, playerId: 19, runsScored: 25, wicketsTaken: 0 },
        { matchId: 5, playerId: 20, runsScored: 0, wicketsTaken: 2 },

        // Match 6: South Africa vs India
        { matchId: 6, playerId: 21, runsScored: 125, wicketsTaken: 0 },
        { matchId: 6, playerId: 22, runsScored: 0, wicketsTaken: 5 },
        { matchId: 6, playerId: 23, runsScored: 92, wicketsTaken: 0 },
        { matchId: 6, playerId: 24, runsScored: 18, wicketsTaken: 0 },
        { matchId: 6, playerId: 25, runsScored: 0, wicketsTaken: 1 },
        { matchId: 6, playerId: 1, runsScored: 78, wicketsTaken: 0 },
        { matchId: 6, playerId: 2, runsScored: 0, wicketsTaken: 3 },
        { matchId: 6, playerId: 3, runsScored: 35, wicketsTaken: 2 },
        { matchId: 6, playerId: 4, runsScored: 0, wicketsTaken: 1 },
        { matchId: 6, playerId: 5, runsScored: 58, wicketsTaken: 0 },

        // Match 7: New Zealand vs Australia
        { matchId: 7, playerId: 26, runsScored: 28, wicketsTaken: 0 },
        { matchId: 7, playerId: 27, runsScored: 0, wicketsTaken: 2 },
        { matchId: 7, playerId: 28, runsScored: 65, wicketsTaken: 0 },
        { matchId: 7, playerId: 29, runsScored: 22, wicketsTaken: 1 },
        { matchId: 7, playerId: 30, runsScored: 35, wicketsTaken: 0 },
        { matchId: 7, playerId: 6, runsScored: 42, wicketsTaken: 0 },
        { matchId: 7, playerId: 7, runsScored: 5, wicketsTaken: 1 },
        { matchId: 7, playerId: 8, runsScored: 88, wicketsTaken: 0 },
        { matchId: 7, playerId: 9, runsScored: 0, wicketsTaken: 3 },
        { matchId: 7, playerId: 10, runsScored: 95, wicketsTaken: 0 },

        // Match 8: Pakistan vs England
        { matchId: 8, playerId: 16, runsScored: 105, wicketsTaken: 0 },
        { matchId: 8, playerId: 17, runsScored: 0, wicketsTaken: 3 },
        { matchId: 8, playerId: 18, runsScored: 48, wicketsTaken: 2 },
        { matchId: 8, playerId: 19, runsScored: 62, wicketsTaken: 0 },
        { matchId: 8, playerId: 20, runsScored: 15, wicketsTaken: 1 },
        { matchId: 8, playerId: 11, runsScored: 92, wicketsTaken: 0 },
        { matchId: 8, playerId: 12, runsScored: 0, wicketsTaken: 2 },
        { matchId: 8, playerId: 13, runsScored: 72, wicketsTaken: 1 },
        { matchId: 8, playerId: 14, runsScored: 28, wicketsTaken: 0 },
        { matchId: 8, playerId: 15, runsScored: 5, wicketsTaken: 0 },

        // Match 9: India vs New Zealand
        { matchId: 9, playerId: 1, runsScored: 68, wicketsTaken: 0 },
        { matchId: 9, playerId: 2, runsScored: 0, wicketsTaken: 4 },
        { matchId: 9, playerId: 3, runsScored: 52, wicketsTaken: 1 },
        { matchId: 9, playerId: 4, runsScored: 12, wicketsTaken: 2 },
        { matchId: 9, playerId: 5, runsScored: 82, wicketsTaken: 0 },
        { matchId: 9, playerId: 26, runsScored: 75, wicketsTaken: 0 },
        { matchId: 9, playerId: 27, runsScored: 0, wicketsTaken: 3 },
        { matchId: 9, playerId: 28, runsScored: 45, wicketsTaken: 0 },
        { matchId: 9, playerId: 29, runsScored: 18, wicketsTaken: 1 },
        { matchId: 9, playerId: 30, runsScored: 38, wicketsTaken: 0 },

        // Match 10: Australia vs South Africa
        { matchId: 10, playerId: 6, runsScored: 115, wicketsTaken: 0 },
        { matchId: 10, playerId: 7, runsScored: 0, wicketsTaken: 2 },
        { matchId: 10, playerId: 8, runsScored: 58, wicketsTaken: 1 },
        { matchId: 10, playerId: 9, runsScored: 0, wicketsTaken: 1 },
        { matchId: 10, playerId: 10, runsScored: 95, wicketsTaken: 0 },
        { matchId: 10, playerId: 21, runsScored: 88, wicketsTaken: 0 },
        { matchId: 10, playerId: 22, runsScored: 0, wicketsTaken: 3 },
        { matchId: 10, playerId: 23, runsScored: 65, wicketsTaken: 0 },
        { matchId: 10, playerId: 24, runsScored: 32, wicketsTaken: 0 },
        { matchId: 10, playerId: 25, runsScored: 0, wicketsTaken: 2 },
    ];

    await db.insert(performance).values(samplePerformances);
    
    console.log('✅ Performance seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});