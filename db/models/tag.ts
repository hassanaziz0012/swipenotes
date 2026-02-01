import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { cards } from './card';

export const tags = sqliteTable('tags', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull().unique(),
});

export const cardTags = sqliteTable('card_tags', {
    cardId: integer('card_id').references(() => cards.id, { onDelete: 'cascade' }).notNull(),
    tagId: integer('tag_id').references(() => tags.id, { onDelete: 'cascade' }).notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.cardId, t.tagId] }),
}));

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
