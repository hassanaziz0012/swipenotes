import { count, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../client';
import { cards } from '../models/card';
import { projects, type NewProject, type Project } from '../models/project';
import { type Session } from '../models/session';

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

export async function getProjectById(projectId: number): Promise<Project | undefined> {
    try {
        const result = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
        return result[0];
    } catch (error) {
        console.error('Failed to get project by id:', error);
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

export async function getProjectsWithCardCounts(userId: number): Promise<{ project: Project; count: number }[]> {
    try {
        const result = await db.select({
            project: projects,
            count: count(cards.id)
        })
        .from(projects)
        .leftJoin(cards, eq(projects.id, cards.projectId))
        .where(eq(projects.userId, userId))
        .groupBy(projects.id)
        .orderBy(desc(count(cards.id)));

        return result.map(row => ({
            project: row.project,
            count: row.count
        }));
    } catch (error) {
        console.error('Failed to get projects with card counts:', error);
        throw error;
    }
}

export async function getProjectCountsForSession(session: Session): Promise<{ project: Pick<Project, 'id' | 'name' | 'color'>; count: number }[]> {
    if (!session.swipeHistory) {
        return [];
    }

    try {
        const swipeHistory = session.swipeHistory as any[];
        const sessionCards = session.cards as any[] || [];
        
        // Build a map of cardId -> card
        const cardMap = new Map<number, any>();
        sessionCards.forEach(card => cardMap.set(card.id, card));

        // Compute project counts from swipe history
        const projectCountsMap = new Map<number, { project: Pick<Project, 'id' | 'name' | 'color'>; count: number }>();
        const projectCache = new Map<number, Pick<Project, 'id' | 'name' | 'color'>>();

        for (const swipe of swipeHistory) {
            const card = cardMap.get(swipe.cardId);
            if (card && card.projectId) {
                let project = projectCache.get(card.projectId);
                if (!project) {
                    const fetchedProject = await getProjectById(card.projectId);
                    if (fetchedProject) {
                        project = { id: fetchedProject.id, name: fetchedProject.name, color: fetchedProject.color };
                        projectCache.set(card.projectId, project);
                    }
                }
                
                if (project) {
                    const existing = projectCountsMap.get(project.id);
                    if (existing) {
                        existing.count += 1;
                    } else {
                        projectCountsMap.set(project.id, { project, count: 1 });
                    }
                }
            }
        }

        return Array.from(projectCountsMap.values()).sort((a, b) => b.count - a.count);
    } catch (error) {
        console.error('Failed to get project counts for session:', error);
        return [];
    }
}
