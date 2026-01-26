CREATE TABLE `cards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`source_note_id` integer NOT NULL,
	`content` text NOT NULL,
	`extra_info` text,
	`created_at` integer NOT NULL,
	`last_seen` integer,
	`interval_days` integer NOT NULL,
	`times_seen` integer NOT NULL,
	`times_left_swiped` integer NOT NULL,
	`times_right_swiped` integer NOT NULL,
	`in_review_queue` integer NOT NULL,
	`word_count` integer NOT NULL,
	`extraction_method` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_note_id`) REFERENCES `source_notes`(`id`) ON UPDATE no action ON DELETE no action
);
