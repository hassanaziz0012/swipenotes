import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { projects } from './project';
import { sourceNotes } from './sourcenote';
import { users } from './user';

export const cards = sqliteTable('cards', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').references(() => users.id).notNull(),
    sourceNoteId: integer('source_note_id').references(() => sourceNotes.id).notNull(),
    projectId: integer('project_id').references(() => projects.id), // Optional - card can belong to one project
    content: text('content').notNull(),
    extraInfo: text('extra_info'), // Optional
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    lastSeen: integer('last_seen', { mode: 'timestamp' }), // Optional
    intervalDays: integer('interval_days').notNull(),
    timesSeen: integer('times_seen').notNull(),
    timesLeftSwiped: integer('times_left_swiped').notNull(),
    timesRightSwiped: integer('times_right_swiped').notNull(),
    inReviewQueue: integer('in_review_queue', { mode: 'boolean' }).notNull(),
    wordCount: integer('word_count').notNull(),
    extractionMethod: text('extraction_method', { enum: ['chunk_paragraph', 'chunk_header', 'ai', 'full'] }).notNull(),

});

export type Card = typeof cards.$inferSelect;
