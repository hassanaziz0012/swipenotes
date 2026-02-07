CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`cards_swiped` integer DEFAULT 0 NOT NULL,
	`swipe_history` text DEFAULT '[]',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
