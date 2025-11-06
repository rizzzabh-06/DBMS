import { db } from '@/db';
import { matches } from '@/db/schema';

async function main() {
    const sampleMatches = [
        {
            venue: 'Melbourne Cricket Ground',
            matchDate: '2024-01-15',
            matchType: 'ODI',
            createdAt: new Date().toISOString(),
        },
        {
            venue: "Lord's Cricket Ground",
            matchDate: '2024-02-20',
            matchType: 'Test',
            createdAt: new Date().toISOString(),
        },
        {
            venue: 'Eden Gardens',
            matchDate: '2024-03-10',
            matchType: 'T20',
            createdAt: new Date().toISOString(),
        },
        {
            venue: 'Sydney Cricket Ground',
            matchDate: '2024-04-05',
            matchType: 'ODI',
            createdAt: new Date().toISOString(),
        },
        {
            venue: 'Wankhede Stadium',
            matchDate: '2024-05-12',
            matchType: 'T20',
            createdAt: new Date().toISOString(),
        },
        {
            venue: 'The Oval',
            matchDate: '2024-06-18',
            matchType: 'Test',
            createdAt: new Date().toISOString(),
        },
        {
            venue: 'Dubai International Stadium',
            matchDate: '2024-07-22',
            matchType: 'T10',
            createdAt: new Date().toISOString(),
        },
        {
            venue: 'Newlands Cricket Ground',
            matchDate: '2024-08-30',
            matchType: 'ODI',
            createdAt: new Date().toISOString(),
        },
        {
            venue: 'Hagley Oval',
            matchDate: '2024-09-14',
            matchType: 'T20',
            createdAt: new Date().toISOString(),
        },
        {
            venue: 'Old Trafford',
            matchDate: '2024-10-25',
            matchType: 'ODI',
            createdAt: new Date().toISOString(),
        },
    ];

    await db.insert(matches).values(sampleMatches);
    
    console.log('✅ Matches seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});