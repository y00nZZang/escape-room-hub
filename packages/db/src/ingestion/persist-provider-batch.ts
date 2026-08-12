import { ProviderManifestSchema } from "@escape-room-hub/contracts";
import {
  AvailabilityBatchSchema,
  CatalogBatchSchema,
  type AvailabilityBatch,
  type CatalogBatch,
} from "@escape-room-hub/provider-kit";

import type { Database } from "../client.js";
import { upsertAvailability } from "../repositories/availability-repository.js";
import { upsertCatalog } from "../repositories/catalog-repository.js";
import { insertSuccessfulCrawlRun } from "../repositories/crawl-run-repository.js";
import { upsertSource } from "../repositories/source-repository.js";

export interface PersistProviderBatchInput {
  readonly availability: AvailabilityBatch;
  readonly catalog: CatalogBatch;
  readonly db: Database;
  readonly finishedAt: Date;
  readonly manifest: unknown;
  readonly startedAt: Date;
}

export interface PersistProviderBatchResult {
  readonly availabilityCount: number;
  readonly crawlRunId: string;
  readonly sourceId: string;
  readonly themeCount: number;
  readonly venueCount: number;
}

export async function persistProviderBatch(
  input: PersistProviderBatchInput,
): Promise<PersistProviderBatchResult> {
  const manifest = ProviderManifestSchema.parse(input.manifest);
  const catalog = CatalogBatchSchema.parse(input.catalog);
  const availability = AvailabilityBatchSchema.parse(input.availability);

  if (
    catalog.providerId !== manifest.providerId ||
    availability.providerId !== manifest.providerId
  ) {
    throw new Error("Manifest, catalog, and availability provider IDs must match");
  }

  const ttlSeconds = Math.max(
    0,
    Math.floor((Date.parse(catalog.expiresAt) - Date.parse(catalog.observedAt)) / 1_000),
  );

  return input.db.transaction(async (tx) => {
    const sourceId = await upsertSource(tx, manifest, ttlSeconds);
    const idMap = await upsertCatalog(tx, sourceId, manifest.distributionScope, catalog);
    const availabilityCount = await upsertAvailability(
      tx,
      sourceId,
      manifest.distributionScope,
      idMap.themeIds,
      availability,
    );
    const recordsSeen = catalog.venues.length + catalog.themes.length + availability.slots.length;
    const crawlRunId = await insertSuccessfulCrawlRun(tx, {
      sourceId,
      startedAt: input.startedAt,
      finishedAt: input.finishedAt,
      recordsSeen,
      recordsWritten: recordsSeen,
    });

    return {
      availabilityCount,
      crawlRunId,
      sourceId,
      themeCount: catalog.themes.length,
      venueCount: catalog.venues.length,
    };
  });
}
