import { z } from "zod";

export const EntityIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:[-_:][a-z0-9]+)*$/u, "Use a stable lowercase identifier");

export const ProviderIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u, "Use a lowercase kebab-case provider ID");

export const IsoDateSchema = z.iso.date();
export const IsoDateTimeSchema = z.iso.datetime({ offset: true });
export const HttpUrlSchema = z
  .url()
  .refine(
    (value) => value.startsWith("https://") || value.startsWith("http://"),
    "Expected an HTTP(S) URL",
  );

export const DistributionScopeSchema = z.enum(["public", "local-only"]);
export type DistributionScope = z.infer<typeof DistributionScopeSchema>;

export const AccessBasisSchema = z.enum([
  "explicit-permission",
  "public-reviewed",
  "experimental-unapproved",
]);
export type AccessBasis = z.infer<typeof AccessBasisSchema>;

export const ProviderStatusSchema = z.enum(["hold", "public"]);
export type ProviderStatus = z.infer<typeof ProviderStatusSchema>;
