import type { ProviderManifest } from "@escape-room-hub/contracts";
import { IsoDateSchema } from "@escape-room-hub/contracts";
import { z } from "zod";

import type { AvailabilityBatch, CatalogBatch } from "./batches.js";

export const AvailabilityRequestSchema = z
  .object({
    dateFrom: IsoDateSchema,
    dateTo: IsoDateSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (value.dateTo < value.dateFrom) {
      context.addIssue({
        code: "custom",
        message: "dateTo must not be earlier than dateFrom",
        path: ["dateTo"],
      });
    }
  });

export type AvailabilityRequest = z.infer<typeof AvailabilityRequestSchema>;

/**
 * A provider is selected from the registered provider catalog. Callers can
 * choose a date range, but cannot supply a URL or other arbitrary target.
 * Network access, when eventually allowed, stays entirely inside an adapter.
 */
export interface EscapeRoomProvider {
  readonly manifest: ProviderManifest;
  fetchCatalog(): Promise<CatalogBatch>;
  fetchAvailability(request: AvailabilityRequest): Promise<AvailabilityBatch>;
}

export class ProviderDisabledError extends Error {
  readonly code = "PROVIDER_DISABLED" as const;
  readonly providerId: string;

  constructor(providerId: string, reason: string) {
    super(`Provider ${providerId} is disabled: ${reason}`);
    this.name = "ProviderDisabledError";
    this.providerId = providerId;
  }
}
