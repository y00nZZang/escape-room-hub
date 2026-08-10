import type { DistributionScope } from "@escape-room-hub/contracts";
import { z } from "zod";

export const DataProfileSchema = z.enum(["public-safe", "local-experimental"]);
export type DataProfile = z.infer<typeof DataProfileSchema>;

export const DataSurfaceSchema = z.enum(["web", "public-api", "mcp-http", "mcp-stdio", "worker"]);
export type DataSurface = z.infer<typeof DataSurfaceSchema>;

export interface RuntimeConfig {
  readonly dataProfile: DataProfile;
}

export interface VisibilityContext {
  readonly profile: DataProfile;
  readonly surface: DataSurface;
}

export interface DistributionScoped {
  readonly distributionScope: DistributionScope;
}

const PUBLIC_SURFACES: ReadonlySet<DataSurface> = new Set(["web", "public-api", "mcp-http"]);

export function parseDataProfile(value: unknown): DataProfile {
  return DataProfileSchema.parse(value ?? "public-safe");
}

export function readRuntimeConfig(
  environment: Readonly<Record<string, string | undefined>>,
): RuntimeConfig {
  return { dataProfile: parseDataProfile(environment.DATA_PROFILE) };
}

/** Public-facing surfaces are hard-capped to public data, regardless of env. */
export function isDistributionScopeVisible(
  scope: DistributionScope,
  context: VisibilityContext,
): boolean {
  if (scope === "public") {
    return true;
  }

  if (PUBLIC_SURFACES.has(context.surface)) {
    return false;
  }

  return context.profile === "local-experimental";
}

export function filterVisibleByScope<T extends DistributionScoped>(
  values: readonly T[],
  context: VisibilityContext,
): T[] {
  return values.filter((value) => isDistributionScopeVisible(value.distributionScope, context));
}

export function allowedDistributionScopes(
  context: VisibilityContext,
): readonly DistributionScope[] {
  return isDistributionScopeVisible("local-only", context) ? ["public", "local-only"] : ["public"];
}
