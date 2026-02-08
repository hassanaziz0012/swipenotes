import { and, desc, eq } from "drizzle-orm";
import { db } from "../client";
import { type Card } from "../models/card";
import { sessions, type NewSession } from "../models/session";

export async function createSession(userId: number, cards: Card[]) {
    const newSession: NewSession = {
        userId,
        startedAt: new Date(),
        isActive: true,
        cardsSwiped: 0,
        swipeHistory: [],
        cards,
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

export async function deleteAllSessions() {
    await db.delete(sessions);
}

export async function getActiveSession(userId: number) {
    const result = await db.select()
        .from(sessions)
        .where(
            and(
                eq(sessions.userId, userId),
                eq(sessions.isActive, true)
            )
        )
        .orderBy(desc(sessions.startedAt))
        .limit(1);
    
    return result[0];
}
