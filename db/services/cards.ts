import { and, count, eq, gte, inArray, lt, sql } from 'drizzle-orm';
import { db } from '../client';
import { cards } from '../models/card';
import { sourceNotes } from '../models/sourcenote';
import { cardTags, tags as tagsTable } from '../models/tag';

export async function deleteCards(cardIds: number[]): Promise<void> {
    try {
        await db.delete(cards).where(inArray(cards.id, cardIds));
    } catch (error) {
        console.error('Failed to delete cards:', error);
        throw error;
    }
}

export async function updateCardContent(cardId: number, newContent: string): Promise<void> {
    try {
        const wordCount = newContent.trim().split(/\s+/).filter(Boolean).length;
        await db.update(cards)
            .set({
                content: newContent,
                wordCount: wordCount
            })
            .where(eq(cards.id, cardId));
    } catch (error) {
        console.error('Failed to update card content:', error);
        throw error;
    }
}

export async function setCardInReviewQueue(cardId: number, inReviewQueue: boolean): Promise<void> {
    try {
        await db.update(cards)
            .set({ inReviewQueue })
            .where(eq(cards.id, cardId));
    } catch (error) {
        console.error('Failed to update card review queue status:', error);
        throw error;
    }
}

export async function toggleCardsReviewQueue(cardIds: number[]): Promise<void> {
    try {
        // Fetch current inReviewQueue status for all cards
        const currentCards = await db.select({ id: cards.id, inReviewQueue: cards.inReviewQueue })
            .from(cards)
            .where(inArray(cards.id, cardIds));

        // Toggle each card's review queue status
        await Promise.all(
            currentCards.map(card =>
                db.update(cards)
                    .set({ inReviewQueue: !card.inReviewQueue })
                    .where(eq(cards.id, card.id))
            )
        );
    } catch (error) {
        console.error('Failed to toggle cards review queue status:', error);
        throw error;
    }
}

export async function updateCardProject(cardId: number, projectId: number | null): Promise<void> {
    try {
        await db.update(cards)
            .set({ projectId })
            .where(eq(cards.id, cardId));
    } catch (error) {
        console.error('Failed to update card project:', error);
        throw error;
    }
}

export async function updateCardTags(cardId: number, tags: string[]): Promise<void> {

    try {
        await db.transaction(async (tx) => {
            // 1. Delete existing cardTags for this card
            await tx.delete(cardTags).where(eq(cardTags.cardId, cardId));

            // 2. For each tag, ensure it exists and link it
            for (const tagName of tags) {
                if (!tagName.trim()) continue;

                // Upsert tag
                let tagId: number;
                const existingTag = await tx.select().from(tagsTable).where(eq(tagsTable.name, tagName)).limit(1);

                if (existingTag.length > 0) {
                    tagId = existingTag[0].id;
                } else {
                    const newTag = await tx.insert(tagsTable).values({ name: tagName }).returning({ id: tagsTable.id });
                    tagId = newTag[0].id;
                }

                // Create link
                await tx.insert(cardTags).values({
                    cardId,
                    tagId
                });
            }
        });
    } catch (error) {
        console.error('Failed to update card tags:', error);
        throw error;
    }
}

export async function updateCard(cardId: number, updates: Partial<typeof cards.$inferInsert>): Promise<void> {
    try {
        await db.update(cards)
            .set(updates)
            .where(eq(cards.id, cardId));
    } catch (error) {
        console.error('Failed to update card:', error);
        throw error;
    }
}


export async function getDailySwipesCount(userId: number): Promise<number> {
    try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        const result = await db.select({ count: count() })
            .from(cards)
            .where(
                and(
                    eq(cards.userId, userId),
                    gte(cards.lastSeen, startOfDay),
                    lt(cards.lastSeen, endOfDay)
                )
            );

        return result[0].count;
    } catch (error) {
        console.error('Failed to get daily swipes count:', error);
        throw error;
    }
}

export async function getTotalCardCount(userId: number): Promise<number> {
    try {
        const result = await db.select({ count: count() })
            .from(cards)
            .where(eq(cards.userId, userId));

        return result[0].count;
    } catch (error) {
        console.error('Failed to get total card count:', error);
        throw error;
    }
}

export async function getCardsInReviewQueueCount(userId: number): Promise<number> {
    try {
        const result = await db.select({ count: count() })
            .from(cards)
            .where(
                and(
                    eq(cards.userId, userId),
                    eq(cards.inReviewQueue, true)
                )
            );

        return result[0].count;
    } catch (error) {
        console.error('Failed to get cards in review queue count:', error);
        throw error;
    }
}

import { type Card } from '../models/card';

export interface CardWithDetails extends Card {
    sourceNoteTitle: string;
    tags: string[];
}

export async function getForgottenGems(userId: number, limit: number = 3): Promise<CardWithDetails[]> {
    try {
        // 1. Get cards with interval >= 30 days, ordered randomly
        const foundCards = await db.select({
            id: cards.id,
            userId: cards.userId,
            sourceNoteId: cards.sourceNoteId,
            projectId: cards.projectId,
            content: cards.content,
            createdAt: cards.createdAt,
            lastSeen: cards.lastSeen,
            intervalDays: cards.intervalDays,
            timesSeen: cards.timesSeen,
            timesLeftSwiped: cards.timesLeftSwiped,
            timesRightSwiped: cards.timesRightSwiped,
            inReviewQueue: cards.inReviewQueue,
            wordCount: cards.wordCount,
            extractionMethod: cards.extractionMethod,
            sourceNoteTitle: sourceNotes.originalFileName,
        })
            .from(cards)
            .innerJoin(sourceNotes, eq(cards.sourceNoteId, sourceNotes.id))
            .where(
                and(
                    eq(cards.userId, userId),
                    gte(cards.intervalDays, 30)
                )
            )
            .orderBy(sql`RANDOM()`)
            .limit(limit);

        if (foundCards.length === 0) {
            return [];
        }

        // 2. Fetch tags for these cards
        const cardIds = foundCards.map(c => c.id);

        const tagsMap = new Map<number, string[]>();

        const tagsResult = await db.select({
            cardId: cardTags.cardId,
            tagName: tagsTable.name
        })
            .from(cardTags)
            .innerJoin(tagsTable, eq(cardTags.tagId, tagsTable.id))
            .where(inArray(cardTags.cardId, cardIds));

        for (const row of tagsResult) {
            if (!tagsMap.has(row.cardId)) {
                tagsMap.set(row.cardId, []);
            }
            tagsMap.get(row.cardId)!.push(row.tagName);
        }

        // 3. Combine results
        return foundCards.map(card => ({
            ...card,
            tags: tagsMap.get(card.id) || []
        }));

    } catch (error) {
        console.error('Failed to get forgotten gems:', error);
        throw error;
    }
}

/**
 * Get a map of date strings (YYYY-MM-DD) to number of cards due on that date,
 * for a given month. Due date = lastSeen + intervalDays. Cards with null lastSeen
 * are considered due today.
 */
export async function getCardsDueInMonth(
    userId: number,
    year: number,
    month: number // 0-indexed
): Promise<Map<string, number>> {
    try {
        const allCards = await db.select({
            lastSeen: cards.lastSeen,
            intervalDays: cards.intervalDays,
        })
            .from(cards)
            .where(eq(cards.userId, userId));

        const dueCounts = new Map<string, number>();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const card of allCards) {
            let dueDate: Date;
            if (card.lastSeen) {
                dueDate = new Date(card.lastSeen);
                dueDate.setDate(dueDate.getDate() + card.intervalDays);
            } else {
                dueDate = new Date(today);
            }
            dueDate.setHours(0, 0, 0, 0);

            if (dueDate.getFullYear() === year && dueDate.getMonth() === month) {
                const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;
                dueCounts.set(key, (dueCounts.get(key) || 0) + 1);
            }
        }

        return dueCounts;
    } catch (error) {
        console.error('Failed to get cards due in month:', error);
        throw error;
    }
}

/**
 * Get all cards whose computed due date matches the given date.
 * Returns CardWithSourceNote[] for use with the CardList component.
 */
export async function getCardsDueOnDate(
    userId: number,
    targetDate: Date
): Promise<CardWithDetails[]> {
    try {
        const target = new Date(targetDate);
        target.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Fetch all cards with source note title (all fields for CardWithDetails)
        const allCards = await db.select({
            id: cards.id,
            userId: cards.userId,
            sourceNoteId: cards.sourceNoteId,
            projectId: cards.projectId,
            content: cards.content,
            createdAt: cards.createdAt,
            lastSeen: cards.lastSeen,
            intervalDays: cards.intervalDays,
            timesSeen: cards.timesSeen,
            timesLeftSwiped: cards.timesLeftSwiped,
            timesRightSwiped: cards.timesRightSwiped,
            inReviewQueue: cards.inReviewQueue,
            wordCount: cards.wordCount,
            extractionMethod: cards.extractionMethod,
            sourceNoteTitle: sourceNotes.originalFileName,
        })
            .from(cards)
            .leftJoin(sourceNotes, eq(cards.sourceNoteId, sourceNotes.id))
            .where(eq(cards.userId, userId));

        // Filter to cards due on the target date
        const matchingCards = allCards.filter(card => {
            let dueDate: Date;
            if (card.lastSeen) {
                dueDate = new Date(card.lastSeen);
                dueDate.setDate(dueDate.getDate() + card.intervalDays);
            } else {
                dueDate = new Date(today);
            }
            dueDate.setHours(0, 0, 0, 0);
            return dueDate.getTime() === target.getTime();
        });

        if (matchingCards.length === 0) {
            return [];
        }

        // Fetch tags for matching cards
        const cardIds = matchingCards.map(c => c.id);
        const cardTagsMap: Record<number, string[]> = {};

        const tagsResult = await db.select({
            cardId: cardTags.cardId,
            tagName: tagsTable.name,
        })
            .from(cardTags)
            .innerJoin(tagsTable, eq(cardTags.tagId, tagsTable.id))
            .where(inArray(cardTags.cardId, cardIds));

        for (const row of tagsResult) {
            if (!cardTagsMap[row.cardId]) {
                cardTagsMap[row.cardId] = [];
            }
            cardTagsMap[row.cardId].push(row.tagName);
        }

        return matchingCards.map(card => ({
            ...card,
            sourceNoteTitle: card.sourceNoteTitle || 'Unknown Source',
            tags: cardTagsMap[card.id] || [],
        }));
    } catch (error) {
        console.error('Failed to get cards due on date:', error);
        throw error;
    }
}
