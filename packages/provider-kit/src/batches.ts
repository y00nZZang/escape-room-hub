import {
  AvailabilitySlotSchema,
  IsoDateTimeSchema,
  ProviderIdSchema,
  ThemeSchema,
  VenueSchema,
} from "@escape-room-hub/contracts";
import { z } from "zod";

function addBatchFreshnessIssue(
  value: { readonly observedAt: string; readonly expiresAt: string },
  context: z.RefinementCtx,
): void {
  if (Date.parse(value.expiresAt) < Date.parse(value.observedAt)) {
    context.addIssue({
      code: "custom",
      message: "expiresAt must not be earlier than observedAt",
      path: ["expiresAt"],
    });
  }
}

export const CatalogBatchSchema = z
  .object({
    providerId: ProviderIdSchema,
    observedAt: IsoDateTimeSchema,
    expiresAt: IsoDateTimeSchema,
    venues: z.array(VenueSchema),
    themes: z.array(ThemeSchema),
  })
  .strict()
  .superRefine((value, context) => {
    addBatchFreshnessIssue(value, context);

    const venueIds = new Set(value.venues.map((venue) => venue.id));
    for (const [index, venue] of value.venues.entries()) {
      if (venue.source.providerId !== value.providerId) {
        context.addIssue({
          code: "custom",
          message: "Venue source providerId must match the batch providerId",
          path: ["venues", index, "source", "providerId"],
        });
      }
    }

    for (const [index, theme] of value.themes.entries()) {
      if (theme.source.providerId !== value.providerId) {
        context.addIssue({
          code: "custom",
          message: "Theme source providerId must match the batch providerId",
          path: ["themes", index, "source", "providerId"],
        });
      }
      if (!venueIds.has(theme.venueId)) {
        context.addIssue({
          code: "custom",
          message: "Theme venueId must refer to a venue in the same catalog batch",
          path: ["themes", index, "venueId"],
        });
      }
    }
  });

export type CatalogBatch = z.infer<typeof CatalogBatchSchema>;

export const AvailabilityBatchSchema = z
  .object({
    providerId: ProviderIdSchema,
    observedAt: IsoDateTimeSchema,
    expiresAt: IsoDateTimeSchema,
    slots: z.array(AvailabilitySlotSchema),
  })
  .strict()
  .superRefine((value, context) => {
    addBatchFreshnessIssue(value, context);

    for (const [index, slot] of value.slots.entries()) {
      if (slot.source.providerId !== value.providerId) {
        context.addIssue({
          code: "custom",
          message: "Slot source providerId must match the batch providerId",
          path: ["slots", index, "source", "providerId"],
        });
      }
    }
  });

export type AvailabilityBatch = z.infer<typeof AvailabilityBatchSchema>;
