CREATE TABLE "bounties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_alien_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"reward_amount" integer,
	"reward_token" text DEFAULT 'USDC',
	"status" text DEFAULT 'open' NOT NULL,
	"lat" text,
	"lon" text,
	"claimed_by_alien_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "last_heartbeat" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_lat" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_lon" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_seen_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bio" text;