import { describe, expect, it } from "vitest";

import {
  AvailabilitySlotSchema,
  ProviderManifestSchema,
  SourceRefSchema,
  ThemeSchema,
  VenueSchema,
} from "../src/index.js";

const source = {
  providerId: "fixture",
  officialUrl: "https://example.invalid/escape-room",
  observedAt: "2026-08-11T10:00:00+09:00",
  expiresAt: "2026-08-11T10:05:00+09:00",
} as const;

describe("normalized entity contracts", () => {
  it("accepts normalized entities with source freshness metadata", () => {
    expect(
      VenueSchema.parse({
        id: "fixture:venue",
        name: "Fixture Venue",
        region: "Seoul",
        source,
      }),
    ).toMatchObject({ source });
    expect(
      ThemeSchema.parse({
        id: "fixture:theme",
        venueId: "fixture:venue",
        name: "Fixture Theme",
        durationMinutes: 60,
        minimumPlayers: 2,
        maximumPlayers: 5,
        minimumPriceKrw: 50_000,
        priceUnit: "per-team",
        source,
      }),
    ).toMatchObject({ source });
    expect(
      AvailabilitySlotSchema.parse({
        themeId: "fixture:theme",
        startsAt: "2026-08-12T19:00:00+09:00",
        status: "available",
        source,
      }),
    ).toMatchObject({ source });
  });

  it("rejects freshness windows that run backwards", () => {
    expect(() =>
      SourceRefSchema.parse({
        ...source,
        expiresAt: "2026-08-11T09:59:59+09:00",
      }),
    ).toThrow();
  });

  it("rejects contradictory player and price facts", () => {
    expect(
      ThemeSchema.safeParse({
        id: "fixture:theme",
        venueId: "fixture:venue",
        name: "Fixture Theme",
        minimumPlayers: 5,
        maximumPlayers: 2,
        minimumPriceKrw: 50_000,
        source,
      }).success,
    ).toBe(false);
  });
});

describe("ProviderManifest policy", () => {
  const reviewedManifest = {
    schemaVersion: "1",
    providerId: "fixture",
    displayName: "Fixture provider",
    status: "public",
    distributionScope: "public",
    accessBasis: "explicit-permission",
    officialUrl: "https://example.invalid/",
    reviewedAt: "2026-08-11T00:00:00+09:00",
    policyRefs: [],
    allowedFields: ["venue.name", "theme.name", "availability.status"],
    crawlIntervalSeconds: 300,
    providerType: "fixture",
  } as const;

  it("accepts an explicitly approved public provider", () => {
    expect(ProviderManifestSchema.safeParse(reviewedManifest).success).toBe(true);
  });

  it("rejects an unapproved provider marked public", () => {
    const result = ProviderManifestSchema.safeParse({
      ...reviewedManifest,
      accessBasis: "experimental-unapproved",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a public provider scoped to local-only", () => {
    const result = ProviderManifestSchema.safeParse({
      ...reviewedManifest,
      distributionScope: "local-only",
    });

    expect(result.success).toBe(false);
  });

  it("rejects undeclared manifest fields", () => {
    const result = ProviderManifestSchema.safeParse({ ...reviewedManifest, secret: "nope" });

    expect(result.success).toBe(false);
  });
});
