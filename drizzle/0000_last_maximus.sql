CREATE TABLE `ai_generations` (
	`generation_id` text PRIMARY KEY NOT NULL,
	`world_id` text,
	`generation_type` text NOT NULL,
	`input_hash` text NOT NULL,
	`output_json` text NOT NULL,
	`model_used` text,
	`tokens_used` integer,
	`created_at` integer,
	FOREIGN KEY (`world_id`) REFERENCES `worlds`(`world_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `events` (
	`event_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`world_id` text,
	`save_id` text,
	`event_type` text NOT NULL,
	`payload_json` text,
	`created_at` integer,
	FOREIGN KEY (`world_id`) REFERENCES `worlds`(`world_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`save_id`) REFERENCES `saves`(`save_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `saves` (
	`save_id` text PRIMARY KEY NOT NULL,
	`world_id` text NOT NULL,
	`slot_number` integer DEFAULT 1 NOT NULL,
	`player_name` text DEFAULT 'Chef',
	`current_region_id` text NOT NULL,
	`player_position_x` integer DEFAULT 0 NOT NULL,
	`player_position_y` integer DEFAULT 0 NOT NULL,
	`player_position_z` integer DEFAULT 0 NOT NULL,
	`day_number` integer DEFAULT 1 NOT NULL,
	`time_of_day` text DEFAULT 'morning' NOT NULL,
	`play_time_seconds` integer DEFAULT 0 NOT NULL,
	`inventory_json` text DEFAULT '[]' NOT NULL,
	`completed_quests_json` text DEFAULT '[]' NOT NULL,
	`active_quests_json` text DEFAULT '[]' NOT NULL,
	`npc_relationships_json` text DEFAULT '{}' NOT NULL,
	`completed_cooking_steps_json` text DEFAULT '[]' NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`world_id`) REFERENCES `worlds`(`world_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `worlds` (
	`world_id` text PRIMARY KEY NOT NULL,
	`seed` text NOT NULL,
	`dish_name` text NOT NULL,
	`model_version` text,
	`prompt_version` text,
	`world_json` text NOT NULL,
	`created_at` integer
);
