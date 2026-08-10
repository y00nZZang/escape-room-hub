import { describe, expect, it } from "vitest";

import {
  allowedDistributionScopes,
  filterVisibleByScope,
  isDistributionScopeVisible,
  parseDataProfile,
} from "../src/index.js";

describe("data profile parsing", () => {
  it("defaults to public-safe", () => {
    expect(parseDataProfile(undefined)).toBe("public-safe");
  });

  it("rejects unknown profiles instead of silently widening access", () => {
    expect(() => parseDataProfile("unsafe")).toThrow();
  });
});

describe("distribution policy", () => {
  const publicSurface = {
    profile: "local-experimental",
    surface: "mcp-http",
  } as const;
  const localSurface = {
    profile: "local-experimental",
    surface: "mcp-stdio",
  } as const;

  it.each(["web", "public-api", "mcp-http"] as const)(
    "never exposes local-only data on %s",
    (surface) => {
      expect(
        isDistributionScopeVisible("local-only", {
          profile: "local-experimental",
          surface,
        }),
      ).toBe(false);
    },
  );

  it("keeps local-only data hidden under public-safe on local transports", () => {
    expect(
      isDistributionScopeVisible("local-only", {
        profile: "public-safe",
        surface: "mcp-stdio",
      }),
    ).toBe(false);
  });

  it("allows local-only data only for an opted-in local surface", () => {
    expect(isDistributionScopeVisible("local-only", localSurface)).toBe(true);
    expect(allowedDistributionScopes(localSurface)).toEqual(["public", "local-only"]);
  });

  it("filters local-only records from public responses", () => {
    const records = [
      { id: "public", distributionScope: "public" as const },
      { id: "private", distributionScope: "local-only" as const },
    ];

    expect(filterVisibleByScope(records, publicSurface)).toEqual([records[0]]);
  });
});
