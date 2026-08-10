import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createFixtureProvider,
  enabledProviders,
  experimentalProviders,
  naverBookingProvider,
  naverBookingProviderManifest,
} from "../src/index.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fixture provider", () => {
  it("returns schema-validated synthetic catalog and availability batches", async () => {
    const provider = createFixtureProvider({
      clock: () => new Date("2026-08-11T01:00:00.000Z"),
    });

    const catalog = await provider.fetchCatalog();
    const availability = await provider.fetchAvailability({
      dateFrom: "2026-08-12",
      dateTo: "2026-08-12",
    });

    expect(catalog).toMatchObject({
      providerId: "fixture",
      venues: [{ region: "Seoul" }],
      themes: [{ durationMinutes: 60, minimumPlayers: 2, maximumPlayers: 5 }],
    });
    expect(availability.slots).toEqual([
      expect.objectContaining({
        startsAt: "2026-08-12T19:00:00+09:00",
        status: "available",
      }),
    ]);
  });

  it("is the only provider in the enabled registry", () => {
    expect(enabledProviders.map((provider) => provider.manifest.providerId)).toEqual(["fixture"]);
  });
});

describe("Naver Booking experimental stub", () => {
  it("remains hold, local-only, and unapproved", () => {
    expect(naverBookingProviderManifest).toMatchObject({
      status: "hold",
      distributionScope: "local-only",
      accessBasis: "experimental-unapproved",
    });
    expect(experimentalProviders).toContain(naverBookingProvider);
    expect(enabledProviders).not.toContain(naverBookingProvider);
  });

  it("fails closed without making a network call", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await expect(naverBookingProvider.fetchCatalog()).rejects.toMatchObject({
      code: "PROVIDER_DISABLED",
      providerId: "naver-booking",
    });
    await expect(
      naverBookingProvider.fetchAvailability({
        dateFrom: "2026-08-11",
        dateTo: "2026-08-12",
      }),
    ).rejects.toMatchObject({ code: "PROVIDER_DISABLED" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
