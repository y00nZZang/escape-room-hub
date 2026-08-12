import { describe, expect, it } from "vitest";

import { requireDatabaseUrl } from "../src/client.js";

describe("DATABASE_URL validation", () => {
  it("accepts PostgreSQL URLs", () => {
    expect(requireDatabaseUrl("postgresql://user:password@localhost:5432/database")).toBe(
      "postgresql://user:password@localhost:5432/database",
    );
  });

  it.each([null, "", "https://localhost/database", "postgresql://localhost"])(
    "rejects invalid value %s",
    (value) => {
      expect(() => requireDatabaseUrl(value)).toThrow(/DATABASE_URL/);
    },
  );
});
