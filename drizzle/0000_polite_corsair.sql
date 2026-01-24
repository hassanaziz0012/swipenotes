CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`full_name` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`daily_card_limit` integer DEFAULT 20 NOT NULL,
	`theme` text DEFAULT 'auto' NOT NULL,
	`notification_enabled` integer DEFAULT false NOT NULL,
	`notification_time` text DEFAULT '09:00' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);