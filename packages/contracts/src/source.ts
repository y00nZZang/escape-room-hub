import { z } from "zod";

import { HttpUrlSchema, IsoDateTimeSchema, ProviderIdSchema } from "./common.js";

export const SourceRefSchema = z
  .object({
    providerId: ProviderIdSchema,
    officialUrl: HttpUrlSchema,
    observedAt: IsoDateTimeSchema,
    expiresAt: IsoDateTimeSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (Date.parse(value.expiresAt) < Date.parse(value.observedAt)) {
      context.addIssue({
        code: "custom",
        message: "expiresAt must not be earlier than observedAt",
        path: ["expiresAt"],
      });
    }
  });

export type SourceRef = z.infer<typeof SourceRefSchema>;
