import { parseDataProfile } from "@escape-room-hub/config";
import type { EscapeRoomProvider } from "@escape-room-hub/provider-kit";

export interface WorkerBootstrapOptions {
  dataProfile?: unknown;
  providers?: readonly EscapeRoomProvider[];
}

export interface WorkerBootstrapResult {
  dataProfile: "public-safe" | "local-experimental";
  networkRequestsMade: 0;
  registeredProviderIds: readonly string[];
  status: "idle";
}

/**
 * Establishes the orchestration boundary without executing providers. Provider execution and
 * persistence are intentionally deferred until a reviewed source is admitted.
 */
export async function bootstrapWorker(
  options: WorkerBootstrapOptions = {},
): Promise<WorkerBootstrapResult> {
  const providers = options.providers ?? [];

  if (providers.length > 0) {
    throw new Error("Live provider registration is disabled in the scaffold milestone");
  }

  return {
    dataProfile: parseDataProfile(options.dataProfile),
    networkRequestsMade: 0,
    registeredProviderIds: [],
    status: "idle",
  };
}
