import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { type Card } from './card';
import { users } from './user';

export const sessions = sqliteTable('sessions', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').references(() => users.id).notNull(),
    startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
    endedAt: integer('ended_at', { mode: 'timestamp' }),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    cardsSwiped: integer('cards_swiped').notNull().default(0),
    swipeHistory: text('swipe_history', { mode: 'json' }).$type<any[]>().default([]),
    cards: text('cards', { mode: 'json' }).$type<Card[]>().default([]),
});

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
