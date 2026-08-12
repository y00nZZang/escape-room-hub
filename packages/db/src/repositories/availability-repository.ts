import type { DistributionScope } from "@escape-room-hub/contracts";
import type { AvailabilityBatch } from "@escape-room-hub/provider-kit";

import { availabilitySlots } from "../schema.js";
import type { DatabaseExecutor } from "./database-executor.js";

export async function upsertAvailability(
  db: DatabaseExecutor,
  sourceId: string,
  distributionScope: DistributionScope,
  themeIds: ReadonlyMap<string, string>,
  batch: AvailabilityBatch,
): Promise<number> {
  let recordsWritten = 0;

  for (const slot of batch.slots) {
    const themeId = themeIds.get(slot.themeId);
    if (themeId === undefined) {
      throw new Error(`Availability references unknown theme ${slot.themeId}`);
    }

    await db
      .insert(availabilitySlots)
      .values({
        themeId,
        sourceId,
        startsAt: new Date(slot.startsAt),
        endsAt: slot.endsAt === undefined ? undefined : new Date(slot.endsAt),
        status: slot.status,
        observedAt: new Date(slot.source.observedAt),
        expiresAt: new Date(slot.source.expiresAt),
        bookingUrl: slot.source.officialUrl,
        distributionScope,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [availabilitySlots.themeId, availabilitySlots.startsAt],
        set: {
          endsAt: slot.endsAt === undefined ? null : new Date(slot.endsAt),
          status: slot.status,
          observedAt: new Date(slot.source.observedAt),
          expiresAt: new Date(slot.source.expiresAt),
          bookingUrl: slot.source.officialUrl,
          distributionScope,
          updatedAt: new Date(),
        },
      });
    recordsWritten += 1;
  }

  return recordsWritten;
}
