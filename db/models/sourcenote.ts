import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './user';

export const sourceNotes = sqliteTable('source_notes', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').references(() => users.id).notNull(),
    originalFileName: text('original_file_name').notNull(),
    importDate: integer('import_date', { mode: 'timestamp' }).notNull(),
    rawContent: text('raw_content').notNull(),
    contentHash: text('content_hash').notNull(),
    fileSize: integer('file_size').notNull(),
});



