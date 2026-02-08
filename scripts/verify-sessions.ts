
import { db } from '../db/client';
import { users } from '../db/models/user';
import { getSessions } from '../db/services/session';

async function verifySessions() {
    try {
        // Get the first user
        const allUsers = await db.select().from(users).limit(1);
        if (allUsers.length === 0) {
            console.log('No users found. creating one...');
             // Logic to create user if needed, but for now just exit or assume one exists
             // Actually, I should probably creating a dummy user if none exists to test properly
             console.log("Please create a user first via the app or manually.");
             return;
        }
        const user = allUsers[0];
        console.log(`Verifying sessions for user: ${user.email} (${user.id})`);

        const sessions = await getSessions(user.id);
        console.log(`Found ${sessions.length} sessions.`);
        
        if (sessions.length > 0) {
             console.log('First session:', JSON.stringify(sessions[0], null, 2));
        } else {
            console.log("No sessions found for this user.");
        }

    } catch (error) {
        console.error('Verification failed:', error);
    }
}

verifySessions();
