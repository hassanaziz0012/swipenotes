import { and, count, eq, gte, inArray, lt } from 'drizzle-orm';
import { db } from '../client';
import { cards } from '../models/card';
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
