import type { ProviderManifest } from "@escape-room-hub/contracts";
import { afterEach, describe, expect, it } from "vitest";

import { buildApi, NOT_CONFIGURED_ERROR } from "../src/app.js";

const apps: ReturnType<typeof buildApi>[] = [];

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe("API scaffold", () => {
  it("reports health without initializing a provider", async () => {
    const app = buildApi({ dataProfile: "public-safe" });
    apps.push(app);

    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      dataProfile: "public-safe",
      dataSurface: "public-api",
      service: "api",
      status: "ok",
    });
  });

  it.each(["/v1/themes", "/v1/availability?themeId=theme-1&date=2026-08-11", "/v1/sources"])(
    "returns NOT_CONFIGURED from %s",
    async (url) => {
      const app = buildApi({ dataProfile: "local-experimental" });
      apps.push(app);

      const response = await app.inject({ method: "GET", url });

      expect(response.statusCode).toBe(503);
      expect(response.json()).toEqual(NOT_CONFIGURED_ERROR);
    },
  );

  it("validates the availability query contract before repository access", async () => {
    const app = buildApi();
    apps.push(app);

    const response = await app.inject({
      method: "GET",
      url: "/v1/availability?date=2026-08-11",
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns only admitted public sources from the public API transport", async () => {
    const baseManifest = {
      schemaVersion: "1",
      status: "public",
      accessBasis: "explicit-permission",
      reviewedAt: "2026-08-11T00:00:00Z",
      policyRefs: [],
      allowedFields: ["officialUrl"],
      crawlIntervalSeconds: 300,
    } satisfies Omit<
      ProviderManifest,
      "providerId" | "displayName" | "distributionScope" | "officialUrl"
    >;
    const sourceManifests: ProviderManifest[] = [
      {
        ...baseManifest,
        providerId: "public-fixture",
        displayName: "Public fixture",
        distributionScope: "public",
        officialUrl: "https://example.invalid/public",
      },
      {
        ...baseManifest,
        providerId: "local-fixture",
        displayName: "Local fixture",
        status: "hold",
        accessBasis: "experimental-unapproved",
        distributionScope: "local-only",
        officialUrl: "https://example.invalid/local",
      },
      {
        ...baseManifest,
        providerId: "held-fixture",
        displayName: "Held fixture",
        status: "hold",
        distributionScope: "public",
        officialUrl: "https://example.invalid/held",
      },
    ];
    const app = buildApi({ dataProfile: "local-experimental", sourceManifests });
    apps.push(app);

    const response = await app.inject({ method: "GET", url: "/v1/sources" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      sources: [
        {
          providerId: "public-fixture",
          displayName: "Public fixture",
          officialUrl: "https://example.invalid/public",
        },
      ],
    });
    expect(response.body).not.toContain("local-fixture");
    expect(response.body).not.toContain("held-fixture");
  });
});
