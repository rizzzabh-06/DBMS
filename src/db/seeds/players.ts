import { db } from '@/db';
import { players } from '@/db/schema';

async function main() {
    const currentTimestamp = new Date().toISOString();
    
    const samplePlayers = [
        // India (teamId: 1)
        {
            name: 'Virat Kohli',
            teamId: 1,
            role: 'Batsman',
            createdAt: currentTimestamp,
        },
        {
            name: 'Jasprit Bumrah',
            teamId: 1,
            role: 'Bowler',
            createdAt: currentTimestamp,
        },
        {
            name: 'Ravindra Jadeja',
            teamId: 1,
            role: 'All-rounder',
            createdAt: currentTimestamp,
        },
        {
            name: 'KL Rahul',
            teamId: 1,
            role: 'Wicket-keeper',
            createdAt: currentTimestamp,
        },
        {
            name: 'Rohit Sharma',
            teamId: 1,
            role: 'Batsman',
            createdAt: currentTimestamp,
        },
        // Australia (teamId: 2)
        {
            name: 'Steve Smith',
            teamId: 2,
            role: 'Batsman',
            createdAt: currentTimestamp,
        },
        {
            name: 'Pat Cummins',
            teamId: 2,
            role: 'Bowler',
            createdAt: currentTimestamp,
        },
        {
            name: 'Glenn Maxwell',
            teamId: 2,
            role: 'All-rounder',
            createdAt: currentTimestamp,
        },
        {
            name: 'Alex Carey',
            teamId: 2,
            role: 'Wicket-keeper',
            createdAt: currentTimestamp,
        },
        {
            name: 'David Warner',
            teamId: 2,
            role: 'Batsman',
            createdAt: currentTimestamp,
        },
        // England (teamId: 3)
        {
            name: 'Joe Root',
            teamId: 3,
            role: 'Batsman',
            createdAt: currentTimestamp,
        },
        {
            name: 'James Anderson',
            teamId: 3,
            role: 'Bowler',
            createdAt: currentTimestamp,
        },
        {
            name: 'Ben Stokes',
            teamId: 3,
            role: 'All-rounder',
            createdAt: currentTimestamp,
        },
        {
            name: 'Jos Buttler',
            teamId: 3,
            role: 'Wicket-keeper',
            createdAt: currentTimestamp,
        },
        {
            name: 'Jonny Bairstow',
            teamId: 3,
            role: 'Batsman',
            createdAt: currentTimestamp,
        },
        // Pakistan (teamId: 4)
        {
            name: 'Babar Azam',
            teamId: 4,
            role: 'Batsman',
            createdAt: currentTimestamp,
        },
        {
            name: 'Shaheen Afridi',
            teamId: 4,
            role: 'Bowler',
            createdAt: currentTimestamp,
        },
        {
            name: 'Shadab Khan',
            teamId: 4,
            role: 'All-rounder',
            createdAt: currentTimestamp,
        },
        {
            name: 'Mohammad Rizwan',
            teamId: 4,
            role: 'Wicket-keeper',
            createdAt: currentTimestamp,
        },
        {
            name: 'Fakhar Zaman',
            teamId: 4,
            role: 'Batsman',
            createdAt: currentTimestamp,
        },
        // South Africa (teamId: 5)
        {
            name: 'Quinton de Kock',
            teamId: 5,
            role: 'Wicket-keeper',
            createdAt: currentTimestamp,
        },
        {
            name: 'Kagiso Rabada',
            teamId: 5,
            role: 'Bowler',
            createdAt: currentTimestamp,
        },
        {
            name: 'Aiden Markram',
            teamId: 5,
            role: 'Batsman',
            createdAt: currentTimestamp,
        },
        {
            name: 'Keshav Maharaj',
            teamId: 5,
            role: 'All-rounder',
            createdAt: currentTimestamp,
        },
        {
            name: 'Temba Bavuma',
            teamId: 5,
            role: 'Batsman',
            createdAt: currentTimestamp,
        },
        // New Zealand (teamId: 6)
        {
            name: 'Kane Williamson',
            teamId: 6,
            role: 'Batsman',
            createdAt: currentTimestamp,
        },
        {
            name: 'Trent Boult',
            teamId: 6,
            role: 'Bowler',
            createdAt: currentTimestamp,
        },
        {
            name: 'Mitchell Santner',
            teamId: 6,
            role: 'All-rounder',
            createdAt: currentTimestamp,
        },
        {
            name: 'Tom Latham',
            teamId: 6,
            role: 'Wicket-keeper',
            createdAt: currentTimestamp,
        },
        {
            name: 'Ross Taylor',
            teamId: 6,
            role: 'Batsman',
            createdAt: currentTimestamp,
        },
    ];

    await db.insert(players).values(samplePlayers);
    
    console.log('✅ Players seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});