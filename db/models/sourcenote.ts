import { eq } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { db } from '../client';
import { cards } from './card';
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

export async function deleteSourceNote(id: number) {
  return await db.transaction(async (tx) => {
    // Delete associated cards first
    await tx.delete(cards).where(eq(cards.sourceNoteId, id));
    // Delete the source note
    await tx.delete(sourceNotes).where(eq(sourceNotes.id, id));
  });
}
