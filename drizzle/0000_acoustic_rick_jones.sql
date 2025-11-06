CREATE TABLE `awards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`award_name` text NOT NULL,
	`award_category` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `match_result` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`match_id` integer,
	`winning_team_id` integer,
	`result_summary` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`winning_team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `match_result_match_id_unique` ON `match_result` (`match_id`);--> statement-breakpoint
CREATE TABLE `match_scores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`match_team_id` integer,
	`runs` integer NOT NULL,
	`wickets` integer NOT NULL,
	`overs` real NOT NULL,
	FOREIGN KEY (`match_team_id`) REFERENCES `match_teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `match_scores_match_team_id_unique` ON `match_scores` (`match_team_id`);--> statement-breakpoint
CREATE TABLE `match_teams` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`match_id` integer,
	`team_id` integer,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`venue` text NOT NULL,
	`match_date` text NOT NULL,
	`match_type` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `performance` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`match_id` integer,
	`player_id` integer,
	`runs_scored` integer DEFAULT 0 NOT NULL,
	`wickets_taken` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `player_awards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` integer,
	`award_id` integer,
	`year` integer NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`award_id`) REFERENCES `awards`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`team_id` integer,
	`role` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sql_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`operation_type` text,
	`table_name` text,
	`sql_statement` text,
	`executed_at` text NOT NULL,
	`status` text,
	`error_message` text
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`country` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teams_name_unique` ON `teams` (`name`);