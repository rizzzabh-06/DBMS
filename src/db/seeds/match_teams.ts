import { db } from '@/db';
import { matchTeams } from '@/db/schema';

async function main() {
    const sampleMatchTeams = [
        // Match 1: India vs Australia
        { matchId: 1, teamId: 1 },
        { matchId: 1, teamId: 2 },
        
        // Match 2: England vs Pakistan
        { matchId: 2, teamId: 3 },
        { matchId: 2, teamId: 4 },
        
        // Match 3: South Africa vs New Zealand
        { matchId: 3, teamId: 5 },
        { matchId: 3, teamId: 6 },
        
        // Match 4: India vs England
        { matchId: 4, teamId: 1 },
        { matchId: 4, teamId: 3 },
        
        // Match 5: Australia vs Pakistan
        { matchId: 5, teamId: 2 },
        { matchId: 5, teamId: 4 },
        
        // Match 6: South Africa vs India
        { matchId: 6, teamId: 5 },
        { matchId: 6, teamId: 1 },
        
        // Match 7: New Zealand vs Australia
        { matchId: 7, teamId: 6 },
        { matchId: 7, teamId: 2 },
        
        // Match 8: Pakistan vs England
        { matchId: 8, teamId: 4 },
        { matchId: 8, teamId: 3 },
        
        // Match 9: India vs New Zealand
        { matchId: 9, teamId: 1 },
        { matchId: 9, teamId: 6 },
        
        // Match 10: Australia vs South Africa
        { matchId: 10, teamId: 2 },
        { matchId: 10, teamId: 5 },
    ];

    await db.insert(matchTeams).values(sampleMatchTeams);
    
    console.log('✅ Match teams seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});