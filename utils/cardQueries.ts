import { and, eq, isNull, or, sql } from "drizzle-orm";
import { cards } from "../db/models/card";
import { users } from "../db/models/user";

// We define a generic for the DB to avoid tight coupling to the Expo client
// In a real app we might use specific Drizzle types, but 'any' or a generic interface is fine for this utility
// to keep it compatible with both BunSQLite and ExpoSQLite instances.
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

    // 2. Query Eligible Cards
    // Criteria:
    // - userId matches
    // - inReviewQueue is false
    // - (lastSeen is null) OR (lastSeen + intervalDays * 86400000 <= now)
    // Order: Random
    // Limit: User's daily limit
    
    // Explanation of DATE LOGIC:
    // sql`${cards.lastSeen} + (${cards.intervalDays} * ${oneDayMs}) <= ${now}`
    // We add the interval (in ms) to the lastSeen timestamp. 
    // If the result is less than or equal to current time, the card is due.

    const eligibleCards = await db.select()
        .from(cards)
        .where(and(
            eq(cards.userId, userId),
            eq(cards.inReviewQueue, false),
            or(
                isNull(cards.lastSeen),
                sql`${cards.lastSeen} + (${cards.intervalDays} * ${oneDayMs}) <= ${now}`
            )
        ))
        .orderBy(sql`RANDOM()`)
        .limit(limit);

    return eligibleCards;
}
