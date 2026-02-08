import { count, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../client';
import { cards } from '../models/card';
import { projects, type NewProject, type Project } from '../models/project';

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
