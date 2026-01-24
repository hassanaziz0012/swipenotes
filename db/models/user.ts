import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    fullName: text('full_name').notNull(),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    dailyCardLimit: integer('daily_card_limit').default(20).notNull(),
    theme: text('theme', { enum: ['light', 'dark', 'auto'] }).default('auto').notNull(),
    notificationEnabled: integer('notification_enabled', { mode: 'boolean' }).default(false).notNull(),
    notificationTime: text('notification_time').default('09:00').notNull(),
});
