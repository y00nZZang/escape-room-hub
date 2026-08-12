import type { DistributionScope } from "@escape-room-hub/contracts";
import type { CatalogBatch } from "@escape-room-hub/provider-kit";

import { themes, venues } from "../schema.js";
import type { DatabaseExecutor } from "./database-executor.js";

export interface CatalogIdMap {
  readonly themeIds: ReadonlyMap<string, string>;
  readonly venueIds: ReadonlyMap<string, string>;
}

export async function upsertCatalog(
  db: DatabaseExecutor,
  sourceId: string,
  distributionScope: DistributionScope,
  batch: CatalogBatch,
): Promise<CatalogIdMap> {
  const venueIds = new Map<string, string>();

  for (const venue of batch.venues) {
    const [storedVenue] = await db
      .insert(venues)
      .values({
        sourceId,
        sourceVenueKey: venue.id,
        name: venue.name,
        branchName: venue.branchName,
        area: venue.region,
        officialUrl: venue.source.officialUrl,
        distributionScope,
        observedAt: new Date(venue.source.observedAt),
        expiresAt: new Date(venue.source.expiresAt),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [venues.sourceId, venues.sourceVenueKey],
        set: {
          name: venue.name,
          branchName: venue.branchName,
          area: venue.region,
          officialUrl: venue.source.officialUrl,
          distributionScope,
          observedAt: new Date(venue.source.observedAt),
          expiresAt: new Date(venue.source.expiresAt),
          updatedAt: new Date(),
        },
      })
      .returning({ id: venues.id });

    if (storedVenue === undefined) {
      throw new Error(`Failed to upsert venue ${venue.id}`);
    }
    venueIds.set(venue.id, storedVenue.id);
  }

  const themeIds = new Map<string, string>();

  for (const theme of batch.themes) {
    const venueId = venueIds.get(theme.venueId);
    if (venueId === undefined) {
      throw new Error(`Theme ${theme.id} references unknown venue ${theme.venueId}`);
    }

    const [storedTheme] = await db
      .insert(themes)
      .values({
        venueId,
        sourceThemeKey: theme.id,
        name: theme.name,
        durationMinutes: theme.durationMinutes,
        minimumPlayers: theme.minimumPlayers,
        maximumPlayers: theme.maximumPlayers,
        minimumPriceKrw: theme.minimumPriceKrw,
        priceUnit: theme.priceUnit ?? "unknown",
        officialUrl: theme.bookingUrl ?? theme.source.officialUrl,
        distributionScope,
        observedAt: new Date(theme.source.observedAt),
        expiresAt: new Date(theme.source.expiresAt),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [themes.venueId, themes.sourceThemeKey],
        set: {
          name: theme.name,
          durationMinutes: theme.durationMinutes,
          minimumPlayers: theme.minimumPlayers,
          maximumPlayers: theme.maximumPlayers,
          minimumPriceKrw: theme.minimumPriceKrw,
          priceUnit: theme.priceUnit ?? "unknown",
          officialUrl: theme.bookingUrl ?? theme.source.officialUrl,
          distributionScope,
          observedAt: new Date(theme.source.observedAt),
          expiresAt: new Date(theme.source.expiresAt),
          updatedAt: new Date(),
        },
      })
      .returning({ id: themes.id });

    if (storedTheme === undefined) {
      throw new Error(`Failed to upsert theme ${theme.id}`);
    }
    themeIds.set(theme.id, storedTheme.id);
  }

  return { themeIds, venueIds };
}
