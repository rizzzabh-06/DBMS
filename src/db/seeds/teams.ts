import { db } from '@/db';
import { teams } from '@/db/schema';

async function main() {
    const sampleTeams = [
        {
            name: 'India',
            country: 'India',
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Australia',
            country: 'Australia',
            createdAt: new Date().toISOString(),
        },
        {
            name: 'England',
            country: 'England',
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Pakistan',
            country: 'Pakistan',
            createdAt: new Date().toISOString(),
        },
        {
            name: 'South Africa',
            country: 'South Africa',
            createdAt: new Date().toISOString(),
        },
        {
            name: 'New Zealand',
            country: 'New Zealand',
            createdAt: new Date().toISOString(),
        }
    ];

    await db.insert(teams).values(sampleTeams);
    
    console.log('✅ Teams seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});