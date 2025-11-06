import { db } from '@/db';
import { awards } from '@/db/schema';

async function main() {
    const sampleAwards = [
        {
            awardName: 'Player of the Match',
            awardCategory: 'Performance',
        },
        {
            awardName: 'Best Batsman',
            awardCategory: 'Performance',
        },
        {
            awardName: 'Best Bowler',
            awardCategory: 'Performance',
        },
        {
            awardName: 'Most Valuable Player',
            awardCategory: 'Season',
        },
        {
            awardName: 'Best Fielder',
            awardCategory: 'Performance',
        },
        {
            awardName: 'Emerging Player',
            awardCategory: 'Season',
        },
        {
            awardName: 'Captain of the Year',
            awardCategory: 'Leadership',
        },
        {
            awardName: 'Fair Play Award',
            awardCategory: 'Conduct',
        }
    ];

    await db.insert(awards).values(sampleAwards);
    
    console.log('✅ Awards seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});