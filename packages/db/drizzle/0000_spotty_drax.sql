CREATE TYPE "public"."access_basis" AS ENUM('explicit-permission', 'public-reviewed', 'experimental-unapproved');--> statement-breakpoint
CREATE TYPE "public"."availability_status" AS ENUM('available', 'unavailable', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."crawl_outcome" AS ENUM('success', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."distribution_scope" AS ENUM('public', 'local-only');--> statement-breakpoint
CREATE TYPE "public"."price_unit" AS ENUM('per-person', 'per-team', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."source_status" AS ENUM('hold', 'public');--> statement-breakpoint
CREATE TABLE "availability_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"theme_id" uuid NOT NULL,
	"source_id" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"status" "availability_status" NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"booking_url" text NOT NULL,
	"distribution_scope" "distribution_scope" NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crawl_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" text NOT NULL,
	"outcome" "crawl_outcome" NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"records_seen" integer DEFAULT 0 NOT NULL,
	"records_written" integer DEFAULT 0 NOT NULL,
	"error_code" text
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"status" "source_status" DEFAULT 'hold' NOT NULL,
	"distribution_scope" "distribution_scope" NOT NULL,
	"access_basis" "access_basis" NOT NULL,
	"official_url" text NOT NULL,
	"robots_url" text,
	"terms_url" text,
	"reviewed_at" timestamp with time zone,
	"minimum_interval_seconds" integer NOT NULL,
	"ttl_seconds" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "themes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"source_theme_key" text NOT NULL,
	"name" text NOT NULL,
	"duration_minutes" integer,
	"minimum_players" integer,
	"maximum_players" integer,
	"minimum_price_krw" integer,
	"price_unit" "price_unit" DEFAULT 'unknown' NOT NULL,
	"official_url" text NOT NULL,
	"distribution_scope" "distribution_scope" NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" text NOT NULL,
	"source_venue_key" text NOT NULL,
	"name" text NOT NULL,
	"branch_name" text,
	"area" text NOT NULL,
	"official_url" text NOT NULL,
	"distribution_scope" "distribution_scope" NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crawl_runs" ADD CONSTRAINT "crawl_runs_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "themes" ADD CONSTRAINT "themes_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "availability_theme_start_unique" ON "availability_slots" USING btree ("theme_id","starts_at");--> statement-breakpoint
CREATE INDEX "availability_scope_expires_idx" ON "availability_slots" USING btree ("distribution_scope","expires_at");--> statement-breakpoint
CREATE INDEX "availability_starts_at_idx" ON "availability_slots" USING btree ("starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "themes_venue_key_unique" ON "themes" USING btree ("venue_id","source_theme_key");--> statement-breakpoint
CREATE INDEX "themes_scope_idx" ON "themes" USING btree ("distribution_scope");--> statement-breakpoint
CREATE UNIQUE INDEX "venues_source_key_unique" ON "venues" USING btree ("source_id","source_venue_key");--> statement-breakpoint
CREATE INDEX "venues_area_idx" ON "venues" USING btree ("area");--> statement-breakpoint
CREATE INDEX "venues_scope_idx" ON "venues" USING btree ("distribution_scope");