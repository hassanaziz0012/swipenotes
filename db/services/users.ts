import { eq } from 'drizzle-orm';
import { db } from '../client';
import { users, type UserSettings } from '../models/user';

export async function updateUserSettings(userId: number, settings: UserSettings): Promise<void> {
    try {
        await db.update(users)
            .set(settings)
            .where(eq(users.id, userId));
    } catch (error) {
        console.error('Failed to update user settings:', error);
        throw error;
    }
}
