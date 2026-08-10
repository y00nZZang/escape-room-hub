import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const sourceStatusEnum = pgEnum("source_status", ["hold", "public"]);
export const distributionScopeEnum = pgEnum("distribution_scope", ["public", "local-only"]);
export const accessBasisEnum = pgEnum("access_basis", [
  "explicit-permission",
  "public-reviewed",
  "experimental-unapproved",
]);
export const availabilityStatusEnum = pgEnum("availability_status", [
  "available",
  "unavailable",
  "unknown",
]);
export const crawlOutcomeEnum = pgEnum("crawl_outcome", ["success", "failed", "skipped"]);
export const priceUnitEnum = pgEnum("price_unit", ["per-person", "per-team", "unknown"]);

export const sources = pgTable("sources", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  status: sourceStatusEnum("status").notNull().default("hold"),
  distributionScope: distributionScopeEnum("distribution_scope").notNull(),
  accessBasis: accessBasisEnum("access_basis").notNull(),
  officialUrl: text("official_url").notNull(),
  robotsUrl: text("robots_url"),
  termsUrl: text("terms_url"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  minimumIntervalSeconds: integer("minimum_interval_seconds").notNull(),
  ttlSeconds: integer("ttl_seconds").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const venues = pgTable(
  "venues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "restrict" }),
    sourceVenueKey: text("source_venue_key").notNull(),
    name: text("name").notNull(),
    branchName: text("branch_name"),
    area: text("area").notNull(),
    officialUrl: text("official_url").notNull(),
    distributionScope: distributionScopeEnum("distribution_scope").notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("venues_source_key_unique").on(table.sourceId, table.sourceVenueKey),
    index("venues_area_idx").on(table.area),
    index("venues_scope_idx").on(table.distributionScope),
  ],
);

export const themes = pgTable(
  "themes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    sourceThemeKey: text("source_theme_key").notNull(),
    name: text("name").notNull(),
    durationMinutes: integer("duration_minutes"),
    minimumPlayers: integer("minimum_players"),
    maximumPlayers: integer("maximum_players"),
    minimumPriceKrw: integer("minimum_price_krw"),
    priceUnit: priceUnitEnum("price_unit").notNull().default("unknown"),
    officialUrl: text("official_url").notNull(),
    distributionScope: distributionScopeEnum("distribution_scope").notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("themes_venue_key_unique").on(table.venueId, table.sourceThemeKey),
    index("themes_scope_idx").on(table.distributionScope),
  ],
);

export const availabilitySlots = pgTable(
  "availability_slots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    themeId: uuid("theme_id")
      .notNull()
      .references(() => themes.id, { onDelete: "cascade" }),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "restrict" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    status: availabilityStatusEnum("status").notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    bookingUrl: text("booking_url").notNull(),
    distributionScope: distributionScopeEnum("distribution_scope").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("availability_theme_start_unique").on(table.themeId, table.startsAt),
    index("availability_scope_expires_idx").on(table.distributionScope, table.expiresAt),
    index("availability_starts_at_idx").on(table.startsAt),
  ],
);

export const crawlRuns = pgTable("crawl_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceId: text("source_id")
    .notNull()
    .references(() => sources.id, { onDelete: "restrict" }),
  outcome: crawlOutcomeEnum("outcome").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  recordsSeen: integer("records_seen").notNull().default(0),
  recordsWritten: integer("records_written").notNull().default(0),
  errorCode: text("error_code"),
});
