CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hash" text NOT NULL,
	"alien_id" text NOT NULL,
	"body" text NOT NULL,
	"ts" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"hash" text PRIMARY KEY NOT NULL,
	"tile" text NOT NULL,
	"slot" text NOT NULL,
	"expires_ts" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alien_id" text NOT NULL,
	"hash" text NOT NULL,
	"lat" text,
	"lon" text,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_post_at" timestamp with time zone
);
