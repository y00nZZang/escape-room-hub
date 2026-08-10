#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { ProviderManifestSchema } from "./provider-manifest.js";

export interface ManifestValidationFailure {
  readonly file: string;
  readonly message: string;
}

export async function validateManifestFiles(
  filePaths: readonly string[],
): Promise<readonly ManifestValidationFailure[]> {
  const failures: ManifestValidationFailure[] = [];

  for (const filePath of filePaths) {
    const absolutePath = resolve(filePath);

    try {
      const raw = await readFile(absolutePath, "utf8");
      const decoded: unknown = JSON.parse(raw);
      const result = ProviderManifestSchema.safeParse(decoded);

      if (!result.success) {
        failures.push({
          file: absolutePath,
          message: result.error.issues
            .map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`)
            .join("; "),
        });
      }
    } catch (error) {
      failures.push({
        file: absolutePath,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return failures;
}

async function main(): Promise<void> {
  const files = process.argv.slice(2);

  if (files.length === 0) {
    console.error("Usage: escape-room-hub-validate-manifest <manifest.json> [...]");
    process.exitCode = 2;
    return;
  }

  const failures = await validateManifestFiles(files);

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(`${failure.file}: ${failure.message}`);
    }
    process.exitCode = 1;
    return;
  }

  for (const file of files) {
    console.log(`valid: ${resolve(file)}`);
  }
}

const invokedAsScript = process.argv[1]
  ? import.meta.url === pathToFileURL(resolve(process.argv[1])).href
  : false;

if (invokedAsScript) {
  await main();
}
