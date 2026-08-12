import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";

import * as schema from "./schema.js";

export type Database = NodePgDatabase<typeof schema>;

export interface DatabaseClient {
  readonly db: Database;
  readonly pool: Pool;
}

export function requireDatabaseUrl(value: unknown = process.env.DATABASE_URL): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("DATABASE_URL is required");
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL URL");
  }

  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    throw new Error("DATABASE_URL must use the postgres or postgresql protocol");
  }
  if (parsed.hostname === "" || parsed.pathname === "" || parsed.pathname === "/") {
    throw new Error("DATABASE_URL must include a host and database name");
  }

  return value;
}

export function createDatabaseClient(
  databaseUrl: unknown = process.env.DATABASE_URL,
  poolConfig: Omit<PoolConfig, "connectionString"> = {},
): DatabaseClient {
  const pool = new Pool({
    ...poolConfig,
    connectionString: requireDatabaseUrl(databaseUrl),
  });

  return {
    db: drizzle(pool, { schema }),
    pool,
  };
}
