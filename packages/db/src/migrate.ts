import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";

import { migrate } from "drizzle-orm/node-postgres/migrator";

import { createDatabaseClient } from "./client.js";

const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));

export async function runMigrations(
  databaseUrl: unknown = process.env.DATABASE_URL,
): Promise<void> {
  const { db, pool } = createDatabaseClient(databaseUrl, { max: 1 });

  try {
    await migrate(db, { migrationsFolder });
  } finally {
    await pool.end();
  }
}

const isMain =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  runMigrations()
    .then(() => {
      console.info("Database migrations completed");
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    });
}
