CREATE TABLE `source_notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`original_file_name` text NOT NULL,
	`import_date` integer NOT NULL,
	`raw_content` text NOT NULL,
	`content_hash` text NOT NULL,
	`file_size` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
