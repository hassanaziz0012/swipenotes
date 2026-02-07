import { and, eq, isNull, or, sql } from "drizzle-orm";
import { cards } from "../db/models/card";
import { users } from "../db/models/user";

export async function queryEligibleCards(userId: number, db: any) {
    // 1. Get User's Daily Limit
    const user = await db.select({ dailyCardLimit: users.dailyCardLimit })
                         .from(users)
                         .where(eq(users.id, userId))
                         .get();

    if (!user) {
        throw new Error("User not found");
    }

    const limit = user.dailyCardLimit;
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // 2. Count cards reviewed today
    // We count cards where lastSeen >= start of today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayUsageResult = await db.select({ count: sql<number>`count(*)` })
        .from(cards)
        .where(and(
            eq(cards.userId, userId),
            sql`${cards.lastSeen} * 1000 >= ${startOfToday.getTime()}`
        ))
        .get();

    const todayUsage = todayUsageResult?.count || 0;
    
    if (todayUsage >= limit) {
        return { cards: [], limitReached: true };
    }

    const remainingLimit = limit - todayUsage;

    // 3. Query Eligible Cards
    // SQLite stores timestamps in seconds when using { mode: 'timestamp' }
    // So we need to either convert lastSeen to ms or convert our comparison values to seconds.
    // Converting comparison values to seconds is safer.
    const nowSeconds = Math.floor(now / 1000);
    const oneDaySeconds = 24 * 60 * 60;

    const eligibleCards = await db.select()
        .from(cards)
        .where(and(
            eq(cards.userId, userId),
            eq(cards.inReviewQueue, false),
            or(
                isNull(cards.lastSeen),
                sql`${cards.lastSeen} + (${cards.intervalDays} * ${oneDaySeconds}) <= ${nowSeconds}`
            )
        ))
        .orderBy(sql`RANDOM()`)
        .limit(remainingLimit);

    return { cards: eligibleCards, limitReached: false };
}

