import { and, eq, inArray, notInArray } from 'drizzle-orm';
import { db } from '../db/client';
import { cards } from '../db/models/card';
import { cardTags, tags, type Tag } from '../db/models/tag';

/** Maximum number of tags that can be assigned to a single card */
export const MAX_TAGS = 10;

/**
 * Get all tags that are associated with a specific user's cards.
 * 
 * @param userId - The ID of the user
 * @returns Array of Tag objects used by the user
 */
export async function getTagsForUser(userId: number): Promise<Tag[]> {
    try {
        // Get all card IDs for this user
        const userCards = await db
            .select({ id: cards.id })
            .from(cards)
            .where(eq(cards.userId, userId));

        const userCardIds = userCards.map(card => card.id);

        if (userCardIds.length === 0) {
            return [];
        }

        // Get unique tag IDs used by the user's cards
        const usedTagLinks = await db
            .select({ tagId: cardTags.tagId })
            .from(cardTags)
            .where(inArray(cardTags.cardId, userCardIds));

        const usedTagIds = [...new Set(usedTagLinks.map(link => link.tagId))];

        if (usedTagIds.length === 0) {
            return [];
        }

        // Fetch the actual tag objects
        const userTags = await db
            .select()
            .from(tags)
            .where(inArray(tags.id, usedTagIds));

        return userTags;
    } catch (error) {
        console.error('Failed to get tags for user:', error);
        throw error;
    }
}

/**
 * Get the usage count for a specific tag for a user.
 * This counts how many of the user's cards are associated with this tag.
 * 
 * @param tagId - The ID of the tag
 * @param userId - The ID of the user
 * @returns The number of cards associated with this tag
 */
export async function getTagUsageCount(tagId: number, userId: number): Promise<number> {
    try {
        // Get all card IDs for this user
        const userCards = await db
            .select({ id: cards.id })
            .from(cards)
            .where(eq(cards.userId, userId));

        const userCardIds = userCards.map(card => card.id);

        if (userCardIds.length === 0) {
            return 0;
        }

        // Count how many of the user's cards have this tag
        const tagLinks = await db
            .select({ cardId: cardTags.cardId })
            .from(cardTags)
            .where(and(
                eq(cardTags.tagId, tagId),
                inArray(cardTags.cardId, userCardIds)
            ));

        return tagLinks.length;
    } catch (error) {
        console.error('Failed to get tag usage count:', error);
        throw error;
    }
}

/**
 * Find all unused tags for a specific user.
 * An unused tag is one that is not associated with any of the user's cards.
 * 
 * @param userId - The ID of the user
 * @returns Array of unused Tag objects
 */
export async function findUnusedTags(userId: number): Promise<Tag[]> {
    try {
        // 1. Get all card IDs for this user
        const userCards = await db
            .select({ id: cards.id })
            .from(cards)
            .where(eq(cards.userId, userId));

        const userCardIds = userCards.map(card => card.id);

        // If user has no cards, all tags are unused
        if (userCardIds.length === 0) {
            return await db.select().from(tags);
        }

        // 2. Get all tag IDs that are used by the user's cards
        const usedTagLinks = await db
            .select({ tagId: cardTags.tagId })
            .from(cardTags)
            .where(inArray(cardTags.cardId, userCardIds));

        const usedTagIds = usedTagLinks.map(link => link.tagId);

        // 3. Find all tags that are NOT in the used tags list
        if (usedTagIds.length === 0) {
            // No tags are used, so all tags are unused
            return await db.select().from(tags);
        }

        const unusedTags = await db
            .select()
            .from(tags)
            .where(notInArray(tags.id, usedTagIds));

        return unusedTags;
    } catch (error) {
        console.error('Failed to find unused tags:', error);
        throw error;
    }
}

/**
 * Delete all unused tags for a specific user.
 * An unused tag is one that is not associated with any of the user's cards.
 * 
 * @param userId - The ID of the user
 * @returns The number of tags that were deleted
 */
export async function deleteUnusedTags(userId: number): Promise<number> {
    try {
        const unusedTags = await findUnusedTags(userId);

        if (unusedTags.length === 0) {
            return 0;
        }

        const unusedTagIds = unusedTags.map(tag => tag.id);

        await db.delete(tags).where(inArray(tags.id, unusedTagIds));

        return unusedTags.length;
    } catch (error) {
        console.error('Failed to delete unused tags:', error);
        throw error;
    }
}
