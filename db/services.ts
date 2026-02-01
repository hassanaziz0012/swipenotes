import { eq, inArray } from 'drizzle-orm';
import { db } from './client';
import { cards } from './models/card';
import { projects, type NewProject, type Project } from './models/project';
import { sourceNotes } from './models/sourcenote';
import { cardTags, tags as tagsTable } from './models/tag';
import { users, type UserSettings } from './models/user';

// Source Note Services
export async function deleteSourceNote(id: number) {
  return await db.transaction(async (tx) => {
    // Delete associated cards first
    await tx.delete(cards).where(eq(cards.sourceNoteId, id));
    // Delete the source note
    await tx.delete(sourceNotes).where(eq(sourceNotes.id, id));
  });
}

// Card Services
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

// User Services
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

// Project Services
export async function createProject(project: Omit<NewProject, 'id'>): Promise<Project> {
    try {
        const result = await db.insert(projects).values(project).returning();
        return result[0];
    } catch (error) {
        console.error('Failed to create project:', error);
        throw error;
    }
}

export async function getProjectsByUser(userId: number): Promise<Project[]> {
    try {
        return await db.select().from(projects).where(eq(projects.userId, userId));
    } catch (error) {
        console.error('Failed to get projects:', error);
        throw error;
    }
}

export async function updateProject(projectId: number, updates: Partial<Omit<NewProject, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
    try {
        await db.update(projects)
            .set(updates)
            .where(eq(projects.id, projectId));
    } catch (error) {
        console.error('Failed to update project:', error);
        throw error;
    }
}

export async function deleteProject(projectId: number): Promise<void> {
    try {
        await db.delete(projects).where(eq(projects.id, projectId));
    } catch (error) {
        console.error('Failed to delete project:', error);
        throw error;
    }
}

export async function deleteProjects(projectIds: number[]): Promise<void> {
    try {
        await db.delete(projects).where(inArray(projects.id, projectIds));
    } catch (error) {
        console.error('Failed to delete projects:', error);
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
