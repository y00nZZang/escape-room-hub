import { z } from "zod";

import { EntityIdSchema, HttpUrlSchema, IsoDateTimeSchema } from "./common.js";
import { SourceRefSchema } from "./source.js";

export const VenueSchema = z
  .object({
    id: EntityIdSchema,
    name: z.string().trim().min(1).max(200),
    branchName: z.string().trim().min(1).max(160).optional(),
    region: z.string().trim().min(1).max(120),
    address: z.string().trim().min(1).max(300).optional(),
    source: SourceRefSchema,
  })
  .strict();

export type Venue = z.infer<typeof VenueSchema>;

export const PriceUnitSchema = z.enum(["per-team", "per-person"]);
export type PriceUnit = z.infer<typeof PriceUnitSchema>;

export const ThemeSchema = z
  .object({
    id: EntityIdSchema,
    venueId: EntityIdSchema,
    name: z.string().trim().min(1).max(200),
    durationMinutes: z.number().int().min(1).max(1_440).optional(),
    minimumPlayers: z.number().int().min(1).max(100).optional(),
    maximumPlayers: z.number().int().min(1).max(100).optional(),
    minimumPriceKrw: z.number().int().min(0).optional(),
    priceUnit: PriceUnitSchema.optional(),
    bookingUrl: HttpUrlSchema.optional(),
    source: SourceRefSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.minimumPlayers !== undefined &&
      value.maximumPlayers !== undefined &&
      value.minimumPlayers > value.maximumPlayers
    ) {
      context.addIssue({
        code: "custom",
        message: "minimumPlayers must not exceed maximumPlayers",
        path: ["minimumPlayers"],
      });
    }

    if (value.minimumPriceKrw !== undefined && value.priceUnit === undefined) {
      context.addIssue({
        code: "custom",
        message: "priceUnit is required when minimumPriceKrw is present",
        path: ["priceUnit"],
      });
    }
  });

export type Theme = z.infer<typeof ThemeSchema>;

export const AvailabilityStatusSchema = z.enum(["available", "unavailable", "unknown"]);
export type AvailabilityStatus = z.infer<typeof AvailabilityStatusSchema>;

export const AvailabilitySlotSchema = z
  .object({
    themeId: EntityIdSchema,
    startsAt: IsoDateTimeSchema,
    endsAt: IsoDateTimeSchema.optional(),
    status: AvailabilityStatusSchema,
    source: SourceRefSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (value.endsAt !== undefined && Date.parse(value.endsAt) <= Date.parse(value.startsAt)) {
      context.addIssue({
        code: "custom",
        message: "endsAt must be later than startsAt",
        path: ["endsAt"],
      });
    }
  });

export type AvailabilitySlot = z.infer<typeof AvailabilitySlotSchema>;
