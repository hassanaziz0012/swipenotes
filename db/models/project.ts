import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './user';

export const projects = sqliteTable('projects', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').references(() => users.id).notNull(),
    name: text('name').notNull(),
    color: text('color').notNull().default('#6366f1'), // Default to a nice indigo color
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
