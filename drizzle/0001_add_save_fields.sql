ALTER TABLE `saves` ADD `collected_item_ids_json` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `saves` ADD `npc_conversation_memory_json` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `saves` ADD `stamina` integer DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE `saves` ADD `player_rotation` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `saves` ADD `game_time_seconds` integer DEFAULT 0 NOT NULL;