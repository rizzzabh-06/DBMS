import { db } from '@/db';
import { matchScores } from '@/db/schema';

async function main() {
    const sampleMatchScores = [
        {
            matchTeamId: 1,
            runs: 320,
            wickets: 7,
            overs: 50.0,
        },
        {
            matchTeamId: 2,
            runs: 315,
            wickets: 9,
            overs: 50.0,
        },
        {
            matchTeamId: 3,
            runs: 285,
            wickets: 8,
            overs: 50.0,
        },
        {
            matchTeamId: 4,
            runs: 290,
            wickets: 10,
            overs: 48.5,
        },
        {
            matchTeamId: 5,
            runs: 425,
            wickets: 10,
            overs: 140.0,
        },
        {
            matchTeamId: 6,
            runs: 380,
            wickets: 10,
            overs: 128.3,
        },
        {
            matchTeamId: 7,
            runs: 185,
            wickets: 6,
            overs: 20.0,
        },
        {
            matchTeamId: 8,
            runs: 188,
            wickets: 4,
            overs: 19.2,
        },
        {
            matchTeamId: 9,
            runs: 295,
            wickets: 5,
            overs: 50.0,
        },
        {
            matchTeamId: 10,
            runs: 298,
            wickets: 3,
            overs: 49.1,
        },
        {
            matchTeamId: 11,
            runs: 165,
            wickets: 8,
            overs: 20.0,
        },
        {
            matchTeamId: 12,
            runs: 168,
            wickets: 7,
            overs: 19.5,
        },
        {
            matchTeamId: 13,
            runs: 510,
            wickets: 10,
            overs: 152.0,
        },
        {
            matchTeamId: 14,
            runs: 485,
            wickets: 10,
            overs: 145.2,
        },
        {
            matchTeamId: 15,
            runs: 95,
            wickets: 5,
            overs: 10.0,
        },
        {
            matchTeamId: 16,
            runs: 92,
            wickets: 9,
            overs: 10.0,
        },
        {
            matchTeamId: 17,
            runs: 340,
            wickets: 6,
            overs: 50.0,
        },
        {
            matchTeamId: 18,
            runs: 335,
            wickets: 10,
            overs: 49.4,
        },
        {
            matchTeamId: 19,
            runs: 195,
            wickets: 7,
            overs: 20.0,
        },
        {
            matchTeamId: 20,
            runs: 198,
            wickets: 5,
            overs: 19.3,
        },
    ];

    await db.insert(matchScores).values(sampleMatchScores);
    
    console.log('✅ Match scores seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});