import { pathToFileURL } from "node:url";

import { enabledProviders } from "@escape-room-hub/providers";

import { ingestProvider } from "../ingestion.js";

const FIXTURE_PROVIDER_ID = "fixture";

export async function ingestFixture(): Promise<Awaited<ReturnType<typeof ingestProvider>>> {
  const provider = enabledProviders.find(
    (candidate) => candidate.manifest.providerId === FIXTURE_PROVIDER_ID,
  );

  if (provider === undefined || provider.manifest.providerType !== "fixture") {
    throw new Error("The registered fixture provider is not available");
  }

  return ingestProvider(provider);
}

const isMain =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  ingestFixture()
    .then((result) => {
      console.info(JSON.stringify(result));
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    });
}
