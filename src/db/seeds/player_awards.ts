import { db } from '@/db';
import { playerAwards } from '@/db/schema';

async function main() {
    const samplePlayerAwards = [
        {
            playerId: 1,
            awardId: 1,
            year: 2024,
        },
        {
            playerId: 1,
            awardId: 2,
            year: 2023,
        },
        {
            playerId: 2,
            awardId: 3,
            year: 2024,
        },
        {
            playerId: 6,
            awardId: 2,
            year: 2024,
        },
        {
            playerId: 6,
            awardId: 4,
            year: 2023,
        },
        {
            playerId: 7,
            awardId: 3,
            year: 2023,
        },
        {
            playerId: 11,
            awardId: 2,
            year: 2022,
        },
        {
            playerId: 12,
            awardId: 3,
            year: 2022,
        },
        {
            playerId: 13,
            awardId: 4,
            year: 2022,
        },
        {
            playerId: 16,
            awardId: 2,
            year: 2021,
        },
        {
            playerId: 17,
            awardId: 6,
            year: 2021,
        },
        {
            playerId: 22,
            awardId: 3,
            year: 2021,
        },
        {
            playerId: 26,
            awardId: 7,
            year: 2021,
        },
        {
            playerId: 3,
            awardId: 5,
            year: 2023,
        },
        {
            playerId: 8,
            awardId: 1,
            year: 2023,
        },
    ];

    await db.insert(playerAwards).values(samplePlayerAwards);
    
    console.log('✅ Player awards seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});