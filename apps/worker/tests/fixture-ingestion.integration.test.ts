import { createDatabaseClient, persistProviderBatch, runMigrations } from "@escape-room-hub/db";
import { createFixtureProvider, fixtureProviderManifest } from "@escape-room-hub/providers";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ingestProvider } from "../src/ingestion.js";

const LOCAL_DATABASE_URL =
  "postgresql://escape_room_hub:escape_room_hub_local@localhost:5432/escape_room_hub";
const integrationEnabled = process.env.RUN_POSTGRES_INTEGRATION === "1";
const describeIntegration = integrationEnabled ? describe : describe.skip;

function makeTestDatabaseUrls(): { adminUrl: string; testUrl: string; testDatabase: string } {
  const baseUrl = new URL(process.env.DATABASE_URL ?? LOCAL_DATABASE_URL);
  const baseDatabase = baseUrl.pathname.slice(1);
  if (!/^[a-zA-Z0-9_]+$/.test(baseDatabase)) {
    throw new Error("Integration test database name contains unsupported characters");
  }

  const testDatabase = `${baseDatabase}_test`;
  const adminUrl = new URL(baseUrl);
  adminUrl.pathname = "/postgres";
  const testUrl = new URL(baseUrl);
  testUrl.pathname = `/${testDatabase}`;

  return { adminUrl: adminUrl.toString(), testUrl: testUrl.toString(), testDatabase };
}

async function tableCounts(pool: Pool): Promise<Record<string, number>> {
  const tableNames = ["sources", "venues", "themes", "availability_slots", "crawl_runs"];
  const counts: Record<string, number> = {};
  for (const tableName of tableNames) {
    const result = await pool.query<{ count: string }>(`SELECT count(*) FROM ${tableName}`);
    counts[tableName] = Number(result.rows[0]?.count ?? 0);
  }
  return counts;
}

describeIntegration("fixture provider PostgreSQL ingestion", () => {
  const urls = makeTestDatabaseUrls();
  let adminPool: Pool;
  let client: ReturnType<typeof createDatabaseClient>;

  beforeAll(async () => {
    adminPool = new Pool({ connectionString: urls.adminUrl, max: 1 });
    await adminPool.query(`DROP DATABASE IF EXISTS ${urls.testDatabase} WITH (FORCE)`);
    await adminPool.query(`CREATE DATABASE ${urls.testDatabase}`);
    await runMigrations(urls.testUrl);
    client = createDatabaseClient(urls.testUrl);
  });

  afterAll(async () => {
    await client?.pool.end();
    if (adminPool !== undefined) {
      await adminPool.query(`DROP DATABASE IF EXISTS ${urls.testDatabase} WITH (FORCE)`);
      await adminPool.end();
    }
  });

  it("upserts catalog and slots while appending runs, and rolls back an invalid batch", async () => {
    const request = { dateFrom: "2026-08-11", dateTo: "2026-08-11" } as const;
    const firstProvider = createFixtureProvider({
      clock: () => new Date("2026-08-11T01:00:00.000Z"),
    });
    const secondProvider = createFixtureProvider({
      clock: () => new Date("2026-08-11T01:05:00.000Z"),
    });

    await ingestProvider(firstProvider, {
      database: client.db,
      request,
      clock: () => new Date("2026-08-11T01:00:00.000Z"),
    });
    expect(await tableCounts(client.pool)).toEqual({
      sources: 1,
      venues: 1,
      themes: 1,
      availability_slots: 1,
      crawl_runs: 1,
    });

    await ingestProvider(secondProvider, {
      database: client.db,
      request,
      clock: () => new Date("2026-08-11T01:05:00.000Z"),
    });
    const stableCounts = {
      sources: 1,
      venues: 1,
      themes: 1,
      availability_slots: 1,
      crawl_runs: 2,
    };
    expect(await tableCounts(client.pool)).toEqual(stableCounts);

    const catalog = await secondProvider.fetchCatalog();
    const availability = await secondProvider.fetchAvailability(request);
    const fixtureVenue = catalog.venues[0];
    const fixtureTheme = catalog.themes[0];
    const fixtureSlot = availability.slots[0];
    if (fixtureVenue === undefined || fixtureTheme === undefined || fixtureSlot === undefined) {
      throw new Error("Fixture provider must return a venue, theme, and slot");
    }
    const invalidCatalog = {
      ...catalog,
      venues: [
        ...catalog.venues,
        {
          ...fixtureVenue,
          id: "fixture:rollback-venue",
          name: "Must Roll Back",
        },
      ],
      themes: [
        ...catalog.themes,
        {
          ...fixtureTheme,
          id: "fixture:rollback-theme",
          venueId: "fixture:rollback-venue",
          name: "Must Roll Back",
        },
      ],
    };
    const invalidAvailability = {
      ...availability,
      slots: [{ ...fixtureSlot, themeId: "fixture:missing-theme" }],
    };

    await expect(
      persistProviderBatch({
        db: client.db,
        manifest: fixtureProviderManifest,
        catalog: invalidCatalog,
        availability: invalidAvailability,
        startedAt: new Date("2026-08-11T01:10:00.000Z"),
        finishedAt: new Date("2026-08-11T01:10:01.000Z"),
      }),
    ).rejects.toThrow("Availability references unknown theme fixture:missing-theme");
    expect(await tableCounts(client.pool)).toEqual(stableCounts);
  });
});
