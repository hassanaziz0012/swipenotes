import { desc, eq } from "drizzle-orm";
import { db } from "../client";
import { sessions, type NewSession } from "../models/session";

export async function createSession(userId: number) {
    const newSession: NewSession = {
        userId,
        startedAt: new Date(),
        isActive: true,
        cardsSwiped: 0,
        swipeHistory: [],
    };

    const result = await db.insert(sessions).values(newSession).returning();
    return result[0];
}

export async function endSession(sessionId: number) {
    const result = await db.update(sessions)
        .set({ 
            isActive: false, 
            endedAt: new Date() 
        })
        .where(eq(sessions.id, sessionId))
        .returning();
    return result[0];
}

export async function getSessionById(sessionId: number) {
    const result = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    return result[0];
}

export async function updateSession(sessionId: number, updates: Partial<NewSession>) {
    const result = await db.update(sessions)
        .set(updates)
        .where(eq(sessions.id, sessionId))
        .returning();
    return result[0];
}

export async function getSessions(userId: number, limit = 20) {
    const result = await db.select()
        .from(sessions)
        .where(eq(sessions.userId, userId))
        .orderBy(desc(sessions.startedAt))
        .limit(limit);
    return result;
}
