import { describe, expect, it } from "vitest";

import {
  AvailabilityRequestSchema,
  CatalogBatchSchema,
  ProviderDisabledError,
} from "../src/index.js";

const source = {
  providerId: "fixture",
  officialUrl: "https://example.invalid/",
  observedAt: "2026-08-11T10:00:00+09:00",
  expiresAt: "2026-08-11T10:05:00+09:00",
} as const;

describe("provider inputs", () => {
  it("accepts only a date range and rejects an arbitrary URL", () => {
    expect(
      AvailabilityRequestSchema.safeParse({
        dateFrom: "2026-08-11",
        dateTo: "2026-08-12",
        url: "https://unregistered.invalid/",
      }).success,
    ).toBe(false);
  });

  it("rejects backwards date ranges", () => {
    expect(
      AvailabilityRequestSchema.safeParse({
        dateFrom: "2026-08-12",
        dateTo: "2026-08-11",
      }).success,
    ).toBe(false);
  });
});

describe("normalized batches", () => {
  it("rejects records whose provider differs from the batch provider", () => {
    const result = CatalogBatchSchema.safeParse({
      providerId: "fixture",
      observedAt: source.observedAt,
      expiresAt: source.expiresAt,
      venues: [
        {
          id: "fixture:venue",
          name: "Fixture Venue",
          region: "Seoul",
          source: { ...source, providerId: "another-provider" },
        },
      ],
      themes: [],
    });

    expect(result.success).toBe(false);
  });
});

describe("ProviderDisabledError", () => {
  it("has a stable machine-readable code", () => {
    expect(new ProviderDisabledError("example", "not configured")).toMatchObject({
      code: "PROVIDER_DISABLED",
      providerId: "example",
    });
  });
});
