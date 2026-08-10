import { z } from "zod";

import {
  AccessBasisSchema,
  DistributionScopeSchema,
  HttpUrlSchema,
  IsoDateTimeSchema,
  ProviderIdSchema,
  ProviderStatusSchema,
} from "./common.js";

export const ProviderTypeSchema = z.enum(["fixture", "direct-site", "naver-booking", "other"]);
export type ProviderType = z.infer<typeof ProviderTypeSchema>;

export const ProviderManifestSchema = z
  .object({
    schemaVersion: z.literal("1"),
    providerId: ProviderIdSchema,
    displayName: z.string().trim().min(1).max(160),
    status: ProviderStatusSchema,
    distributionScope: DistributionScopeSchema,
    accessBasis: AccessBasisSchema,
    officialUrl: HttpUrlSchema,
    reviewedAt: IsoDateTimeSchema,
    policyRefs: z.array(HttpUrlSchema).max(20),
    allowedFields: z.array(z.string().trim().min(1).max(120)).min(1).max(100),
    crawlIntervalSeconds: z.number().int().min(60).max(2_592_000),
    providerType: ProviderTypeSchema.optional(),
    robotsUrl: HttpUrlSchema.optional(),
    termsUrl: HttpUrlSchema.optional(),
    notes: z.string().trim().max(2_000).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.status === "public" && value.distributionScope !== "public") {
      context.addIssue({
        code: "custom",
        message: "A public provider must use the public distribution scope",
        path: ["distributionScope"],
      });
    }

    if (value.status === "public" && value.accessBasis === "experimental-unapproved") {
      context.addIssue({
        code: "custom",
        message: "An unapproved experimental provider cannot be public",
        path: ["accessBasis"],
      });
    }

    if (
      value.accessBasis === "experimental-unapproved" &&
      (value.status !== "hold" || value.distributionScope !== "local-only")
    ) {
      context.addIssue({
        code: "custom",
        message: "Unapproved experiments must remain hold and local-only",
        path: ["accessBasis"],
      });
    }
  });

export type ProviderManifest = z.infer<typeof ProviderManifestSchema>;

export function parseProviderManifest(input: unknown): ProviderManifest {
  return ProviderManifestSchema.parse(input);
}
