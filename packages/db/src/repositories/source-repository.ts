import type { ProviderManifest } from "@escape-room-hub/contracts";

import { sources } from "../schema.js";
import type { DatabaseExecutor } from "./database-executor.js";

export async function upsertSource(
  db: DatabaseExecutor,
  manifest: ProviderManifest,
  ttlSeconds: number,
): Promise<string> {
  const now = new Date();
  const [source] = await db
    .insert(sources)
    .values({
      id: manifest.providerId,
      displayName: manifest.displayName,
      status: manifest.status,
      distributionScope: manifest.distributionScope,
      accessBasis: manifest.accessBasis,
      officialUrl: manifest.officialUrl,
      robotsUrl: manifest.robotsUrl,
      termsUrl: manifest.termsUrl,
      reviewedAt: new Date(manifest.reviewedAt),
      minimumIntervalSeconds: manifest.crawlIntervalSeconds,
      ttlSeconds,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: sources.id,
      set: {
        displayName: manifest.displayName,
        status: manifest.status,
        distributionScope: manifest.distributionScope,
        accessBasis: manifest.accessBasis,
        officialUrl: manifest.officialUrl,
        robotsUrl: manifest.robotsUrl,
        termsUrl: manifest.termsUrl,
        reviewedAt: new Date(manifest.reviewedAt),
        minimumIntervalSeconds: manifest.crawlIntervalSeconds,
        ttlSeconds,
        updatedAt: now,
      },
    })
    .returning({ id: sources.id });

  if (source === undefined) {
    throw new Error(`Failed to upsert source ${manifest.providerId}`);
  }

  return source.id;
}
