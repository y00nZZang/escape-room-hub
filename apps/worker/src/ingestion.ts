import { ProviderManifestSchema } from "@escape-room-hub/contracts";
import {
  createDatabaseClient,
  type Database,
  persistProviderBatch,
  type PersistProviderBatchResult,
} from "@escape-room-hub/db";
import {
  AvailabilityBatchSchema,
  CatalogBatchSchema,
  type AvailabilityRequest,
  type EscapeRoomProvider,
} from "@escape-room-hub/provider-kit";

export interface IngestProviderOptions {
  readonly clock?: () => Date;
  readonly database?: Database;
  readonly databaseUrl?: unknown;
  readonly request?: AvailabilityRequest;
}

function dateInSeoul(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export async function ingestProvider(
  provider: EscapeRoomProvider,
  options: IngestProviderOptions = {},
): Promise<PersistProviderBatchResult> {
  const clock = options.clock ?? (() => new Date());
  const startedAt = clock();
  const manifest = ProviderManifestSchema.parse(provider.manifest);
  const catalog = CatalogBatchSchema.parse(await provider.fetchCatalog());
  const request = options.request ?? {
    dateFrom: dateInSeoul(startedAt),
    dateTo: dateInSeoul(startedAt),
  };
  const availability = AvailabilityBatchSchema.parse(await provider.fetchAvailability(request));
  const finishedAt = clock();

  if (options.database !== undefined) {
    return persistProviderBatch({
      db: options.database,
      manifest,
      catalog,
      availability,
      startedAt,
      finishedAt,
    });
  }

  const client = createDatabaseClient(options.databaseUrl);
  try {
    return await persistProviderBatch({
      db: client.db,
      manifest,
      catalog,
      availability,
      startedAt,
      finishedAt,
    });
  } finally {
    await client.pool.end();
  }
}
